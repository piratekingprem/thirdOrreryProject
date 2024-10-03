const express = require('express');
const app = express();
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const cors = require('cors');
app.use(cors({
  origin: 'https://third-orrery-project-udtr.vercel.app', // Replace with your deployed frontend's URL
  methods: 'GET', // Specify allowed HTTP methods
  credentials: true // Allow credentials if needed (like cookies or authorization headers)
}));

const port = 3001; // Your choice of port


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