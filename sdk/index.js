require('dotenv').config();

const express = require('express');
const cors = require('cors');

const identityRoutes = require('./src/routes/identity.routes');
const vehicleRoutes = require('./src/routes/vehicle.routes');
const tokenRoutes = require('./src/routes/token.routes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/identities', identityRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/tokens', tokenRoutes);

app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'CarTrade Fabric SDK'
    });
});

app.listen(PORT, () => {
    console.log(`CarTrade SDK running on port ${PORT}`);
});
