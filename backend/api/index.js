const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import CORS middleware
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const app = express();
const port = 3001; // Your choice of port
const api = process.env.API_KEY
// Use CORS to allow requests from different origins
app.use(cors());

app.get('/api/v1/get_info/:planet', async(req,res)=> {
    const {planet} = req.params;
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Give the detail information of ${planet} in points` ;
    const result = await model.generateContent(prompt);
    res.send(result.response.text());
})


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});