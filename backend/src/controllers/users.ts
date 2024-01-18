import { type Request, type Response } from 'express';
import { User } from '../entity/User';

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const users = await User.find();

  return res.json(users);
};

export const getUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { user_id } = req.params;

  const user = await User.findOneBy({
    id: parseInt(user_id),
  });

  if (user == null) {
    return res.status(404).json({ message: 'Invalid user ID.' });
  }

  return res.json(user);
};
