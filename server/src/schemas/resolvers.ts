import { AuthenticationError } from 'apollo-server-express';
import { signToken } from '../services/auth';
import User, { UserDocument } from '../models/User';
import { BookDocument } from '../models/Book';


const resolvers = {
    Query: {
        me: async (_parent: any, _args: any, context: { user?: UserDocument }): Promise<UserDocument | null> => {

            if (context.user) {
                return await User.findById(context.user._id).populate('savedBooks');
            }
            throw new AuthenticationError('You need to be logged in!');
        },

    },

    Mutation: {
        login: async (_parent: any, { email, password }: { email: string, password: string }): Promise<{ token: string; user: UserDocument }> => {

            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const isValidPassword = await user.isCorrectPassword(password);
            if (!isValidPassword) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const token = signToken(user.username, user.email, user._id);
            return { token, user };
        },

        addUser: async (_parent: any, { username, email, password }: { username: string, email: string, password: string }): Promise<{ token: string; user: UserDocument }> => {
            const user = await User.create({ username, email, password });

            const token = signToken(user.username, user.email, user._id);
            return { token, user };
        },

        saveBook: async (_parent: any, args: BookDocument, context: { user?: UserDocument }): Promise<UserDocument | null> => {
            if (context.user) {
                return await User.findByIdAndUpdate(
                    context.user._id, {
                    $addToSet: {
                        savedBooks: { savedBooks: args }
                    },
                },
                    { new: true }
                ).populate('savedBooks');
               }
            throw new AuthenticationError('You need to be logged in!');

        },

    },

    removeBook: async (_parent: any, { bookId }: { bookId: string }, context: { user?: UserDocument }): Promise<UserDocument | null> => {
        if (context.user) {
            return await User.findByIdAndUpdate(
                context.user._id, {
                $pull: {
                    savedBooks: { bookId } } },
                { new: true }
            ).populate('savedBooks');
        }
        throw new AuthenticationError('You need to be logged in!');
    },
};


export default resolvers;