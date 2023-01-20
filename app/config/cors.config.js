var corsConfiguration = {
    origin: 'http://localhost:3000',
    methods: ["GET", "POST"],
    optionSuccessStatus: 200,
    credentials: true
}

module.exports = corsConfiguration;