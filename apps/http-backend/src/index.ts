import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from './middleware';
import {
    CreateUserSchema,
    SigninSchema,
    createRoomSchema,
} from '@repo/common/types';
import { prismaClient } from '@repo/db/client';

const app = express();

app.use(express.json());

app.post('/signup', async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log(parsedData.error);
        res.json({
            message: 'Incorrect inputs',
        });
        return;
    }
    // i will hash this pass later
    try {
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data?.username,
                password: parsedData.data.password,
                name: parsedData.data.name,
            },
        });
        res.json({
            userId: user.id,
        });
    } catch (e) {
        res.status(411).json({
            message: 'User already exists with this username',
        });
    }
});
app.post('/signin', async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: 'Incorrect Inputs',
        });
        return;
    }

    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
            password: parsedData.data.password,
        },
    });

    if (!user) {
        res.status(403).json({
            message: 'user does not exist',
        });
        return;
    }

    const token = jwt.sign(
        {
            userId: user?.id,
        },
        JWT_SECRET
    );
    res.json({ token });
});

app.post('/room', middleware, async (req, res) => {
    const parsedData = createRoomSchema.safeParse(req.body);
    if (!parsedData) {
        res.json({
            message: 'incorrect inputs',
        });
        return;
    }

    // i dont know why type script i did createRoomSchema , also corrected middleware , i will checkitout
    const userId = req.userId;
    if (!userId) {
        res.status(400).json({ message: 'Admin ID is required' });
        return;
    }

    if (!parsedData.data?.name) {
        res.status(400).json({ message: 'Slug is required' });
        return;
    }

    console.log(parsedData);
    console.log(userId);

    try {
        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data?.name,
                adminId: userId,
            },
        });

        res.json({
            roomId: room.id,
        });
    } catch (e) {
        res.status(411).json({
            message: 'Room already exists with this name',
        });
    }
});

app.get('/chats/:roomId', async (req, res) => {
    const roomId = Number(req.params.roomId);
    const messages = await prismaClient.chat.findMany({
        where: {
            roomId: roomId,
        },
        orderBy: {
            id: 'desc',
        },
        take: 50,
    });
    res.json({
        messages,
    });
});

app.listen(3001);
