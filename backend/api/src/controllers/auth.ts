import { Request, Response } from 'express'
import { ILike } from 'typeorm';
import { User } from '../entity/User'
import { validateUser, validatePassword } from '../util/validator';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const hashPassword = async (password: string) => {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
}

export const createUser = async (req: Request, res: Response) => {
    const { email, first_name, last_name, nick_name, is_organizer, is_admin, password } = req.body;

    // TODO(jan): Make this cleaner (schema validation + password validation)
    // Validate all of schema except password_hash (not yet generated)
    const { error, value } = validateUser({
        email, first_name, last_name, nick_name, is_organizer, is_admin
    });

    if (error) {
        return res.status(400).json(error.details);
    }

    // Validate password
    const passwordValidationResult = validatePassword(password);

    if (passwordValidationResult.error) {
        return res.status(400).json(passwordValidationResult.error.details);
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

    // Hash password and create
    value.password_hash = await hashPassword(password);
    
    const newUser = User.create(value);
    await newUser.save();

    return res.status(201).json(newUser);
}

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, first_name, last_name, nick_name, is_organizer, is_admin, password } = req.body;

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

    if (password) {
        const passwordValidationResult = validatePassword(password);
        if (passwordValidationResult.error) {
            return res.status(400).json(passwordValidationResult.error.details);
        }
        
        user.password_hash = await hashPassword(password);
    }

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

export const login = async ( req: Request, res: Response ) => {
    // TODO(jan): Once new database schema is setup, add actual password hash comparison and user info population
    // TODO(jan): Add field validation (express-validator)
    if (true) {
        // Authorized
        const userInfo = { username: '',  isAdmin: false, isOrganizer: false }
        const accessToken = jwt.sign({ userInfo }, process.env.JWT_ACCESS_SECRET || '')

        res.json({ accessToken: accessToken })
    } else {
        // Unauthorized
        res.status(401).json({ message: "Authentication failed" })
    }
}
