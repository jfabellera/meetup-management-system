import { Request, Response } from 'express'
import { User } from '../entity/User'

export const getAllUsers = async (req: Request, res: Response) => {
    const users = await User.find();
    res.json(users);
}

export const getUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await User.findOneBy({
        id: parseInt(id)
    });
    res.json(user);
}

// TODO(jan): Add rest of user APIs
