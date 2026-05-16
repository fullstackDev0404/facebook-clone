const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Clean existing data
    await prisma.notification.deleteMany()
    await prisma.message.deleteMany()
    await prisma.friendship.deleteMany()
    await prisma.like.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.post.deleteMany()
    await prisma.user.deleteMany()

    const password = await bcrypt.hash('password123', 10)

    // Create users
    const alice = await prisma.user.create({
        data: {
            email: 'alice@example.com',
            password,
            firstName: 'Alice',
            lastName: 'Johnson',
            bio: 'Living life one day at a time 🌸',
            gender: 'Female',
        }
    })

    const bob = await prisma.user.create({
        data: {
            email: 'bob@example.com',
            password,
            firstName: 'Bob',
            lastName: 'Smith',
            bio: 'Software engineer & coffee addict ☕',
            gender: 'Male',
        }
    })

    const carol = await prisma.user.create({
        data: {
            email: 'carol@example.com',
            password,
            firstName: 'Carol',
            lastName: 'White',
            bio: 'Food lover 🍜 | Travel enthusiast ✈️',
            gender: 'Female',
        }
    })

    // Create posts
    const post1 = await prisma.post.create({
        data: {
            content: 'Just had an amazing day at the beach! 🌊☀️',
            authorId: alice.id,
        }
    })

    const post2 = await prisma.post.create({
        data: {
            content: 'Finally shipped my side project after 3 months! 🚀',
            authorId: bob.id,
        }
    })

    // Create likes
    await prisma.like.create({ data: { userId: bob.id, postId: post1.id, type: 'like' } })
    await prisma.like.create({ data: { userId: carol.id, postId: post1.id, type: 'love' } })
    await prisma.like.create({ data: { userId: alice.id, postId: post2.id, type: 'like' } })

    // Create comments
    await prisma.comment.create({
        data: { content: 'Looks amazing! 😍', authorId: bob.id, postId: post1.id }
    })

    // Create friendship
    await prisma.friendship.create({
        data: { senderId: alice.id, receiverId: bob.id, status: 'accepted' }
    })

    console.log('✅ Seed complete!')
    console.log('   Test accounts: alice@example.com / bob@example.com / carol@example.com')
    console.log('   Password for all: password123')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
