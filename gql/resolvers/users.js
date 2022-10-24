const { UserInputError } = require('apollo-server')
const bcrypt = require('bcryptjs')

const User = require('../../models/User')
// import { validateAuthUser } from '../../utils/validators'
const { generateToken } = require('../../utils/token')

module.exports.UserMutations = {
    async register(_, { email, password }) {
        try {
            // const { valid, errors } = validateAuthUser(email, password)
            // if (!valid) {
            //     throw new UserInputError('Registration Errors', { errors })
            // }

            const user = await User.findOne({ email })
            if (user) {
                throw new UserInputError('User Exists', {
                    errors: {
                        email: 'User already exists with these credentials'
                    }
                })
            }
            const salt = bcrypt.genSaltSync()
            const hashedPw = bcrypt.hashSync(password, salt)
            const newUser = new User({
                email,
                password: hashedPw
            })
            const savedUser = await newUser.save()
            const token = generateToken(savedUser)

            return { ...savedUser._doc, id: savedUser._id, token }
        } catch (error) {
            return new Error(error)
        }
    }
}

module.exports.UserQueries = {
    async getUser(_, { email }) {
        try {
            const user = await User.findOne({ email })
            if (user) {
                return user
            }
            throw new UserInputError("User Doesn't Exist ", {
                errors: {
                    user: 'No user found with those credentials'
                }
            })
        } catch (error) {
            throw new Error(error)
        }
    },
    async getLoggedInUser(_, {}, context) {
        try {
            // const token = validateToken(context)
            const token = { valid: false, user: { email: null } }
            if (!token.valid) {
                throw new Error('Invalid User Token')
            }

            const user = await User.findOne({ email: token.user.email })

            return user
        } catch (error) {
            throw new Error(error)
        }
    },
    async getAllUsers() {
        try {
            const users = await User.find()
            if (users?.length) {
                return users
            }
            throw new UserInputError('No Users ', {
                errors: {
                    user: 'No users found'
                }
            })
        } catch (error) {
            throw new Error(error)
        }
    }
}
