import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import React from 'react'

const Homepage = () => {
    return (
        <div className='flex flex-col min-h-screen bg-gray-100 dark:bg-[rgb(24,25,26)] text-foreground'>
            <Header />
            <div className='flex flex-1 pt-14 max-w-screen-xl mx-auto w-full'>
                {/* Left Sidebar */}
                <LeftSidebar />

                {/* Main Feed */}
                <main className='flex-1 px-4 py-4'>
                    {/* Feed content goes here (Day 3) */}
                    <div className='max-w-xl mx-auto'>
                        <div className='bg-white dark:bg-[rgb(36,37,38)] rounded-xl shadow p-4 text-center text-gray-400 text-sm'>
                            Feed coming soon...
                        </div>
                    </div>
                </main>

                {/* Right Sidebar */}
                <RightSidebar />
            </div>
        </div>
    )
}

export default Homepage
