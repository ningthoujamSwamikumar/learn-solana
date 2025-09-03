use std::error::Error;
use std::fmt;

macro_rules! assert_non_zero {
    ($array:expr) => {
        if $array.contains(&0u64) {
            return Err(CurveError::ZeroBalance);
        }
    };
}

macro_rules! withdraw_slippage {
    ($x: expr, $y:expr, $x_min:expr, $y_min:expr) => {
        if $x < $x_min || $y < $y_min {
            return Err(CurveError::SlippageLimitedExceeded);
        }
    };
}

macro_rules! deposit_slippage {
    ($x:expr, $y:expr, $x_max:expr, $y_max:expr) => {
        if $x > $x_max || $y > $y_max {
            return Err(CurveError::SlippageLimitedExceeded);
        }
    };
}

/// checks if swap return token is the desired amount
macro_rules! swap_slippage {
    ($x: expr, $x_min: expr) => {
        if $x < $x_min {
            return Err(CurveError::SlippageLimitedExceeded);
        }
    };
}

#[derive(Debug)]
pub enum LiquidityPair {
    X,
    Y,
}

#[derive(Debug)]
pub struct SpotPrice {
    pub amount: u128,
    pub precision: u32,
}

#[derive(Debug)]
pub struct XYAmouts {
    pub x: u64,
    pub y: u64,
}

#[derive(Debug)]
pub struct DepositLiquidityResult {
    pub deposit_x: u64,
    pub deposit_y: u64,
    pub mint_l: u64,
}

#[derive(Debug)]
pub struct WithdrawLiquidityResult {
    pub withdraw_x: u64,
    pub withdraw_y: u64,
    pub burn_l: u64,
}

#[derive(Debug)]
pub struct SwapResult {
    pub deposit: u64,
    pub withdraw: u64,
    pub fee: u64,
}

#[derive(Debug)]
pub enum CurveError {
    ZeroBalance,
    SlippageLimitedExceeded,
    InvalidPrecision,
    Overflow,
    Underflow,
}

impl Error for CurveError {}

impl fmt::Display for CurveError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Debug)]
pub struct ConstantProduct {
    x: u64,   //Balance of Token X
    y: u64,   //Balance of Token Y
    l: u64,   //LP Token Balance
    fee: u16, //Fee in basis points, ie 100 = 1%
    precision: u32,
}

impl ConstantProduct {
    // Create a new Constant Product Curve
    pub fn init(
        x: u64,
        y: u64,
        l: u64,
        fee: u16,
        precision: Option<u8>,
    ) -> Result<ConstantProduct, CurveError> {
        // Assert non-zero values of X and Y
        assert_non_zero!([x, y]);
        let precision = match precision {
            Some(p) => 10u32
                .checked_pow(p as u32)
                .ok_or(CurveError::InvalidPrecision)?,
            None => 1_000_000,
        };

        //if L is zero, make it the higher value of either X or Y, as this will have less rounding errors
        let l = match l > 0 {
            true => 1,
            false => x.max(y),
        };

        Ok(ConstantProduct {
            x,
            y,
            l,
            fee,
            precision,
        })
    }

    //Static Methods

    //Static Invariant calculation
    pub fn k_frm_xy(x: u64, y: u64) -> Result<u128, CurveError> {
        assert_non_zero!([x, y]);
        Ok((x as u128).checked_mul(y as u128).unwrap())
    }

    //Get spot price for a token in its opposing token
    //spot price: how many token B can be get by 1 token A, at the moment
    pub fn spot_price_from_pair(x: u64, y: u64, precision: u32) -> Result<SpotPrice, CurveError> {
        assert_non_zero!([x, y]);
        Ok(SpotPrice {
            amount: (x as u128)
                .checked_mul(precision as u128)
                .ok_or(CurveError::Overflow)?
                .checked_div(y as u128)
                .ok_or(CurveError::Overflow)?,
            precision,
        })
    }

    //Get amount of X and Y to deposit from liquidity token amount
    /// x: current reserve of token X \
    /// y: current reserve of token Y \
    /// l: current total liquidity supply (LP tokens) \
    /// a: how many new LP tokens you want to mint (i.e. new liquidity share) \
    pub fn xy_deposit_amounts_from_l(
        x: u64,
        y: u64,
        l: u64,
        a: u64,
        precision: u32,
    ) -> Result<XYAmouts, CurveError> {
        // ratio of new l to old l, precisioned
        let ratio = (l as u128)
            .checked_add(a as u128)
            .ok_or(CurveError::Overflow)?
            .checked_mul(precision as u128)
            .ok_or(CurveError::Overflow)?
            .checked_div(l as u128)
            .ok_or(CurveError::Overflow)?;

        //what needs to be deposited, to maintain the ratio LP reserver, and also associated to 'a'
        let deposit_x = (x as u128)
            .checked_mul(ratio)
            .ok_or(CurveError::Overflow)?
            .checked_div(precision as u128)
            .ok_or(CurveError::Overflow)?
            .checked_sub(x as u128)
            .ok_or(CurveError::Overflow)? as u64;

        //what needs to be deposited, to maintain the ratio of LP reserve, and also associated to 'a'
        let deposit_y = (y as u128)
            .checked_mul(ratio)
            .ok_or(CurveError::Overflow)?
            .checked_div(precision as u128)
            .ok_or(CurveError::Overflow)?
            .checked_sub(y as u128)
            .ok_or(CurveError::Overflow)? as u64;

        Ok(XYAmouts {
            x: deposit_x,
            y: deposit_y,
        })
    }

    //get amount of X and Y to withdraw from liquidity token amount
    pub fn xy_withdraw_amounts_from_l(
        x: u64,
        y: u64,
        l: u64,
        a: u64,
        precision: u32,
    ) -> Result<XYAmouts, CurveError> {
        let ratio = ((l - a) as u128)
            .checked_mul(precision as u128)
            .ok_or(CurveError::Overflow)?
            .checked_div(l as u128)
            .ok_or(CurveError::Overflow)?;

        let withdraw_x = (x as u128)
            .checked_sub(
                (x as u128)
                    .checked_mul(ratio)
                    .ok_or(CurveError::Overflow)?
                    .checked_div(precision as u128)
                    .ok_or(CurveError::Overflow)?,
            )
            .ok_or(CurveError::Overflow)? as u64;

        let withdraw_y = (y as u128)
            .checked_sub(
                (y as u128)
                    .checked_mul(ratio)
                    .ok_or(CurveError::Overflow)?
                    .checked_div(precision as u128)
                    .ok_or(CurveError::Overflow)?,
            )
            .ok_or(CurveError::Overflow)? as u64;

        Ok(XYAmouts {
            x: withdraw_x,
            y: withdraw_y,
        })
    }

    //Calculate new value of X after depositing Y
    //When we swap amount A of Y for X, we must calculate the new balance of X from invariant K
    //Y2 = Y2 + Amount
    // X2 = K / Y2
    pub fn x2_from_y_swap_amount(x: u64, y: u64, a: u64) -> Result<u64, CurveError> {
        let k = Self::k_frm_xy(x, y)?;
        let y_new = (y as u128)
            .checked_add(a as u128)
            .ok_or(CurveError::Overflow)?;

        Ok(k.checked_div(y_new).ok_or(CurveError::Overflow)? as u64)
    }

    //Calculate new value of Y after depositing X
    pub fn y2_from_x_swap_amount(x: u64, y: u64, a: u64) -> Result<u64, CurveError> {
        Self::x2_from_y_swap_amount(y, x, a)
    }

    //Calculate difference in Y from swapping in X
    // dY = Y1 - Y2
    pub fn delta_y_from_x_swap_amount(x: u64, y: u64, a: u64) -> Result<u64, CurveError> {
        Ok(y.checked_sub(Self::y2_from_x_swap_amount(x, y, a)?)
            .ok_or(CurveError::Overflow)?)
    }

    pub fn delta_x_from_y_swap_amount(x: u64, y: u64, a: u64) -> Result<u64, CurveError> {
        Self::delta_y_from_x_swap_amount(y, x, a)
    }

    //// Getter methods

    // Invariant calculation
    // K = X * Y
    pub fn k(&self) -> Result<u128, CurveError> {
        Self::k_frm_xy(self.x, self.y)
    }

    //spot price of current balances as integer with rounding precision
    pub fn spot_price_x(&self) -> Result<SpotPrice, CurveError> {
        Self::spot_price_from_pair(self.x, self.y, self.precision)
    }

    pub fn spot_price_y(&self) -> Result<SpotPrice, CurveError> {
        Self::spot_price_from_pair(self.y, self.x, self.precision)
    }

    // Setter methods

    //Unsafe methods simply set values and make no attempt to control for slippage
    pub fn swap_unsafe(&mut self, p: LiquidityPair, a: u64) -> Result<SwapResult, CurveError> {
        //net input amount after applying the swap fee
        let a2 = (a as u128)
            .checked_mul((10_000 - self.fee) as u128)
            .ok_or(CurveError::Overflow)?
            .checked_div(10_000)
            .ok_or(CurveError::Overflow)? as u64;

        let (new_x, new_y, withdraw) = match p {
            LiquidityPair::X => (
                self.x.checked_add(a2).ok_or(CurveError::Overflow)?,
                Self::y2_from_x_swap_amount(self.x, self.y, a2)?,
                Self::delta_y_from_x_swap_amount(self.x, self.y, a2)?,
            ),
            LiquidityPair::Y => (
                Self::x2_from_y_swap_amount(self.x, self.y, a)?,
                self.y.checked_add(a).ok_or(CurveError::Overflow)?,
                Self::delta_x_from_y_swap_amount(self.x, self.y, a2)?,
            ),
        };

        let fee = a.checked_sub(a2).ok_or(CurveError::Underflow)?;
        self.x = new_x;
        self.y = new_y;

        Ok(SwapResult {
            deposit: a,
            withdraw,
            fee,
        })
    }

    // Swap asset X for asset Y or vice versa with slippage protection
    pub fn swap(&mut self, p: LiquidityPair, a: u64, min: u64) -> Result<SwapResult, CurveError> {
        //amount after applying fee
        let a2 = (a as u128)
            .checked_mul((10_000 - self.fee) as u128)
            .ok_or(CurveError::Overflow)?
            .checked_div(10_000)
            .ok_or(CurveError::Overflow)? as u64;

        let (new_x, new_y, withdraw) = match p {
            LiquidityPair::X => {
                let x2 = self.x.checked_add(a2).ok_or(CurveError::Overflow)?;
                let y2 = Self::y2_from_x_swap_amount(self.x, self.y, a2)?;
                let delta_y = Self::delta_y_from_x_swap_amount(self.x, self.y, a2)?;
                (x2, y2, delta_y)
            }
            LiquidityPair::Y => {
                let x2 = Self::x2_from_y_swap_amount(self.x, self.y, a2)?;
                let y2 = self.y.checked_add(a2).ok_or(CurveError::Overflow)?;
                let delta_x = Self::delta_x_from_y_swap_amount(self.x, self.y, a2)?;
                (x2, y2, delta_x)
            }
        };

        swap_slippage!(withdraw, min);
        let fee = a.checked_sub(a2).ok_or(CurveError::Underflow)?;
        self.x = new_x;
        self.y = new_y;

        Ok(SwapResult {
            deposit: a,
            withdraw,
            fee,
        })
    }

    /// x: token x amount to be deposited
    /// y: token y amount to be deposited
    /// a: liquidity token amount to be minted
    pub fn deposit_liquidity_unsafe(
        &mut self,
        x: u64,
        y: u64,
        a: u64,
    ) -> Result<DepositLiquidityResult, CurveError> {
        self.x.checked_add(x).ok_or(CurveError::Overflow)?;
        self.y.checked_add(y).ok_or(CurveError::Overflow)?;
        self.l.checked_add(a).ok_or(CurveError::Overflow)?;
        Ok(DepositLiquidityResult {
            deposit_x: x,
            deposit_y: y,
            mint_l: a,
        })
    }

    pub fn withdraw_liquidity_unsafe(
        &mut self,
        x: u64,
        y: u64,
        a: u64,
    ) -> Result<WithdrawLiquidityResult, CurveError> {
        self.x.checked_sub(x).ok_or(CurveError::Underflow)?;
        self.y.checked_sub(y).ok_or(CurveError::Underflow)?;
        self.l.checked_sub(a).ok_or(CurveError::Underflow)?;
        Ok(WithdrawLiquidityResult {
            withdraw_x: x,
            withdraw_y: y,
            burn_l: a,
        })
    }

    pub fn deposit_liquidity(
        &mut self,
        a: u64,
        max_x: u64,
        max_y: u64,
    ) -> Result<DepositLiquidityResult, CurveError> {
        let xy = Self::xy_deposit_amounts_from_l(self.x, self.y, self.l, a, self.precision)?;

        deposit_slippage!(xy.x, xy.y, max_x, max_y);
        self.deposit_liquidity_unsafe(xy.x, xy.y, a)
    }

    pub fn withdraw_liquidity(
        &mut self,
        a: u64,
        min_x: u64,
        min_y: u64,
    ) -> Result<WithdrawLiquidityResult, CurveError> {
        let xy = Self::xy_withdraw_amounts_from_l(self.x, self.y, self.l, a, self.precision)?;
        withdraw_slippage!(xy.x, xy.y, min_x, min_y);
        self.withdraw_liquidity_unsafe(xy.x, xy.y, a)
    }
}

#[cfg(test)]
mod tests;
