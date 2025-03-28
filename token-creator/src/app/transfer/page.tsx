"use client"

import SendSol from '@/components/send-sol';
import SendToken from '@/components/send-token';
import React, { useState } from 'react'

const Page = () => {
    return (
        <main className="mt-8 flex flex-col space-y-4 justify-center items-center">
            <SendSol />
            <SendToken />
        </main>
    )
}

export default Page;