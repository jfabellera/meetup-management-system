import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Meetup } from '../entity/Meetup';
import { Ticket } from '../entity/Ticket';
import { User } from '../entity/User';

enum Rule {
    requireOrganizer,
    requireAdmin,
    overrideOrganizer,
    overrideAdmin,
    overrideMeetupOrganizer // Organizer of meetup
}

interface TokenInterface {
    id: number;
    nick_name: string;
    is_organizer: boolean;
    is_admin: boolean;

}

const reject = (res: Response) => {
    return res.status(401).json({ message: 'Invalid authorization.' });
}

const checkMeetupOrganizer = async (meetupId: number, userId: number): Promise<boolean> => {
    const meetup = await Meetup.findOneBy({
        id: meetupId
    });

    if (meetup?.organizer_ids.includes(userId)) {
        return true;
    }
    return false;
}

// TODO(jan): Make it so that there is only 1 next() at the end of the function.
// so that if there is any data transfer from auth middleware to next function,
// that is handled.
export const authChecker = (rules: Rule[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.header('Authorization');
        // const prefix = authHeader?.split(' ')[0]
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return res.status(401).send({ message: 'No auth token found. Authorization denied.' });
        }

        // Get requestor user
        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret') as TokenInterface;
        const user = await User.findOneBy({
            id: decodedToken.id
        });

        // Reject if user does not exist
        if (!user) return res.status(404).json({ message: 'Invalid user ID.'});

        if (rules) {
            // Account type overrides
            if (rules.includes(Rule.overrideOrganizer) && user.is_organizer) next();
            if (rules.includes(Rule.overrideAdmin) && user.is_admin) next();

            // Account type requires
            if (rules.includes(Rule.requireOrganizer) && !user.is_organizer) return reject(res);
            if (rules.includes(Rule.requireAdmin) && !user.is_admin) return reject(res);
        }

        // If accessing a user, check that the requestor is the user
        if (req.params.user_id) {
            if (user.id != parseInt(req.params.user_id)) {
                return reject(res);
            }

            // TODO(jan): Pass user to next function
        }

        // If accessing a ticket, check that the requestor is the owner of the ticket
        if (req.params.ticket_id) {
            const ticket = await Ticket.findOneBy({
                id: parseInt(req.params.ticket_id)
            });

            if (!ticket) return res.status(404).json({ message: 'Invalid ticket ID.'});
            // TODO(jan): Pass ticket to next function

            if (rules.includes(Rule.overrideMeetupOrganizer) && await checkMeetupOrganizer(ticket.id, user.id)) {
                next();
            }

            if (user.id != ticket.user_id) {
                return reject(res);
            }
        }

        // If accessing a meetup, check that the requestor is an organizer of the meetup
        if (req.params.meetup_id) {
            const meetup = await Meetup.findOneBy({
                id: parseInt(req.params.meetup_id)
            });

            if (!meetup) return res.status(404).json({ message: 'Invalid meetup ID.'});
            // TODO(jan): Pass meetup to next function

            if (!meetup.organizer_ids.includes(user.id)) {
                return reject(res);
            }
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: 'Oopsie woopsie!!!' });
    }
}