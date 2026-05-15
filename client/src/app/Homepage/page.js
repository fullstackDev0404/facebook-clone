import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import Feed from '@/component/Feed'
import React from 'react'

const Homepage = () => {
    return (
        <div className='flex flex-col min-h-screen bg-gray-100 dark:bg-[rgb(24,25,26)]'>
            {/* Fixed top navbar */}
            <Header />

            {/* 3-column layout below header */}
            <div className='flex flex-1 pt-14 max-w-7xl mx-auto w-full'>

                {/* Column 1 — Left Sidebar (fixed width, sticky) */}
                <LeftSidebar />

                {/* Column 2 — Main Feed (flexible center) */}
                <main className='flex-1 min-w-0 px-4 py-4'>
                    <Feed />
                </main>

                {/* Column 3 — Right Sidebar (fixed width, sticky) */}
                <RightSidebar />

            </div>
        </div>
    )
}

export default Homepage
