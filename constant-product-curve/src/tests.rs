use crate::{ConstantProduct, LiquidityPair};

#[test]
fn swap_balance() {
    //if we start with 20 of token X and 30 of token Y and precision of 1,
    // K should equal 600
    let mut c = ConstantProduct::init(20, 30, 0, 0, None).unwrap();
    assert_eq!(c.k().unwrap(), 600);
    assert_eq!(c.x, 20);
    assert_eq!(c.y, 30);

    //if we deposit 5 x token X, the user should receive 6 of token Y.
    //The final balances should be - Token X: 25, Token Y: 24.
    let res = c.swap(LiquidityPair::X, 5, 6).unwrap();
    assert_eq!(c.k().unwrap(), 600);
    assert_eq!(res.deposit, 5);
    assert_eq!(res.withdraw, 6);
    assert_eq!(c.x, 25);
    assert_eq!(c.y, 24);

    //If we deposit another 5 x tokenX, the user should receive 4 of token Y.
    //The final balances should be - Token X: 30, Token Y: 20.
    let res = c.swap(LiquidityPair::X, 5, 4).unwrap();
    assert_eq!(c.k().unwrap(), 600);
    assert_eq!(res.deposit, 5);
    assert_eq!(res.withdraw, 4);
    assert_eq!(c.x, 30);
    assert_eq!(c.y, 20);
}

#[test]
fn swap_balance_with_fee() {
    // If we start with 20 of token X and 30 of token Y and precision of 1, K should equal 600
    let mut c = ConstantProduct::init(20, 30, 0, 100, None).unwrap();
    assert_eq!(c.k().unwrap(), 600);
    assert_eq!(c.x, 20);
    assert_eq!(c.y, 30);

    //If we deposit 5 x token X, the user should pay a fee of 1 and thus only receive 5 of token Y.
    // The final balances should be - Token X: 24, Token Y: 25.
    let res = c.swap(LiquidityPair::X, 5, 5).unwrap();
    assert_eq!(res.deposit, 5);
    assert_eq!(res.withdraw, 5);
    assert_eq!(res.fee, 1);
    assert_eq!(c.x, 24);
    assert_eq!(c.y, 25);
}

#[test]
fn deposit_liquidity() {
    //If we start with 20 of token X, and 30 of token Y, and precision of 1, K should equal 600
    let mut c = ConstantProduct::init(20, 30, 0, 100, None).unwrap();
    assert_eq!(c.k().unwrap(), 600);
    assert_eq!(c.x, 20);
    assert_eq!(c.y, 30);

    let r = c.deposit_liquidity(30, 10_000_000, 10_000_000).unwrap();
    assert_eq!(r.deposit_x, 20);
    assert_eq!(r.deposit_y, 30);
    assert_eq!(r.mint_l, 30);

    let r = c.withdraw_liquidity(30, 0, 0).unwrap();
    assert_eq!(r.withdraw_x, 20);
    assert_eq!(r.withdraw_y, 30);
    assert_eq!(r.burn_l, 30);
}
