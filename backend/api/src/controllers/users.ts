import { Request, Response } from 'express'
import { ILike } from 'typeorm';
import { User } from '../entity/User'
import { validateUser } from '../util/validator'


export const getAllUsers = async (req: Request, res: Response) => {
    const users = await User.find();

    return res.json(users);
}

export const getUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await User.findOneBy({
        id: parseInt(id)
    });

    if (!user) {
        return res.status(404).json({ message: 'Invalid user ID.'});
    }

    return res.json(user);
}

export const createUser = async (req: Request, res: Response) => {
    const { error, value } = validateUser(req.body);

    if (error) {
        return res.status(400).json(error.details);
    }

    // Check if email is taken
    const existingUser = await User.findOne({
        where: {
            email:  ILike(value.email)
        }
    });

    if (existingUser) {
        return res.status(409).json({ message: 'Email is taken.' });
    }

    const newUser = User.create(value);
    await newUser.save();

    return res.status(201).json(newUser);
}

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, first_name, last_name, nick_name, is_organizer, is_admin } = req.body;

    const user = await User.findOneBy({
        id: parseInt(id)
    });

    if (!user) {
        return res.status(404).json({ message: 'Invalid user ID.' });
    }

    // Check if email is taken
    const existingUser = await User.findOne({
        where: {
            email:  ILike(email)
        }
    });

    if (existingUser) {
        return res.status(409).json({ message: 'Email is taken.' });
    }

    user.email = email ?? user.email;
    user.first_name = first_name ?? user.first_name;
    user.last_name = last_name ?? user.last_name;
    user.nick_name = nick_name ?? user.nick_name;
    user.is_organizer = is_organizer ?? user.is_organizer;
    user.is_admin = is_admin ?? user.is_admin;

    const { error, value } = validateUser(user);
    
    if (error) {
        return res.status(400).json(error.details);
    }

    await user.save();

    return res.status(201).json(user);
}

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await User.findOneBy({
        id: parseInt(id)
    });

    if (!user) {
        return res.status(404).json({ message: 'Invalid user ID.' });
    }

    user.remove();

    return res.status(204).end();
}
