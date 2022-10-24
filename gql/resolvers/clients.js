const axios = require('axios')
const { format } = require('date-fns')

const Clients = require('../../models/Clients')
const {
    validateNewClientFields
} = require('../../utils/validators/validate-clients')
const {
    sendIntroMeetingResponse
} = require('../../utils/mailer/clients/introMeetingResponse')

const phases = {
    PHASE_1: 'Phase 1: Information Gathering',
    PHASE_2: 'Phase 2: Structure & Design',
    PHASE_3: 'Phase 3: Initial Development',
    PHASE_4: 'Phase 4: Testing/QA',
    PHASE_5: 'Phase 5: Post Launch Maintenance',
    PHASE_6: 'Phase 6: New Version Development'
}

module.exports.ClientMutations = {
    async addNewClient(_, { eventUri, inviteeUri }) {
        try {
            const authHeader = {
                headers: {
                    Authorization: `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`
                }
            }
            const { data: eventData } = await axios.get(eventUri, authHeader)
            const { data: inviteeData } = await axios.get(
                inviteeUri,
                authHeader
            )

            const { location, start_time, created_at } = eventData.resource
            const { first_name, last_name, questions_and_answers, email } =
                inviteeData.resource

            const existingClient = await Clients.findOne({ email })

            if (existingClient) {
                existingClient.meetings = [
                    ...existingClient.meetings,
                    {
                        location: location.type,
                        url: location.join_url,
                        created: new Date(created_at),
                        scheduledFor: new Date(start_time),
                        prepInfo: questions_and_answers
                    }
                ]
                const updatedClient = await existingClient.save()
                return { ...updatedClient._doc, id: updatedClient._id }
            }

            const newClient = new Clients({
                email,
                firstName: first_name,
                lastName: last_name,
                meetings: [
                    {
                        location: location.type,
                        url: location.join_url,
                        created: new Date(created_at),
                        scheduledFor: new Date(start_time),
                        prepInfo: questions_and_answers
                    }
                ],
                status: phases.PHASE_1
            })
            // trigger an email sent to the new client welcoming them and letting them know we got and confirmed their meeting request
            const savedClient = await newClient.save()

            await sendIntroMeetingResponse(email, {
                location: location.type,
                dateTime: format(new Date(start_time), 'MM/dd h:m aaa')
            })
            return { ...savedClient._doc, id: savedClient._id }
        } catch (error) {
            console.log(error)
            return new Error(error)
        }
    }
}

module.exports.ClientQueries = {
    async getAllClients(_, {}, context) {
        try {
            const clients = await Clients.find()
            return clients
        } catch (error) {
            console.log(error)
            throw new Error(error)
        }
    }
}
