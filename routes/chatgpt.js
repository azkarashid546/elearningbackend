const express = require('express');
const chatRouter = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});



// Define route handler for ChatGPT functionality
chatRouter.post('/completions', async (req, res) => {
  const { message } = req.body;

  try {
  const result = await model.generateContent(message);
  const response = await result.response;
  const text = response.text();
  console.log(`response from gen AI => ${text}`);
  res.status(200).json({message:text})
    // // Send message to ChatGPT API
    // const response = await fetch('https://gemini.googleapis.com/v1/complete', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${process.env.GOOGLE_GEMINI_API_KEY}`,
    //   },
    //   body: JSON.stringify({
    //     prompt: message,
    //     model: 'gemini-1',
    //     maxTokens: 150,
    //   }),
    // });

    // // Check for expected response format
    // if (!response.headers.get('Content-Type').includes('application/json')) {
    //   console.error('Unexpected response format. Content-Type:', response.headers.get('Content-Type'));
    //   console.log('Full response:', response); // Log the entire response for debugging
    //   return res.status(500).json({ error: 'An unexpected error occurred.' });
    // }

    // // Try parsing JSON, handle potential errors
    // let data;
    // try {
    //   data = await response.json();
    //   console.log(data)
    // } catch (error) {
    //   console.error('Error parsing JSON response:', error);
    //   return res.status(500).json({ error: 'An error occurred while processing your request.' });
    // }

    // // Send response back to client
    // res.json(data.choices[0]);
  } catch (error) {
    console.error('Error occurred while fetching from ChatGPT API:', error);
    // Handle other potential errors (network, API request failures) here
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

module.exports = chatRouter;