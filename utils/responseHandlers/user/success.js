const USER_SUCCESS = 'UserSuccess'

const baseResponse = ({ type, user, token }) => {
    const response = {
        __typename: USER_SUCCESS,
        successType: type,
        ...user._doc
    }

    if (token) {
        response.token = token
    }

    return response
}

const baseArrayResponse = ({ type, users }) =>
    users.map(user => ({
        ...user._doc,
        __typename: USER_SUCCESS,
        successType: type
    }))

module.exports = {
    registered: (user, token) =>
        baseResponse({ type: 'registered', user, token }),
    loggedIn: user => baseResponse({ type: 'loggedIn', user }),
    fetchedUser: user => baseResponse({ type: 'fetchedUser', user }),
    allUsersFetched: users =>
        baseArrayResponse({ type: 'allUsersFetched', users })
}