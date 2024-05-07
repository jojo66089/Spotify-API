const express = require('express');
const axios = require('axios'); 
const app = express();
const port = 3000; 
const path = require('path');
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);

});
app.use(express.static(path.join(__dirname, '/Users/joshuaguillen/Desktop/Spotify Quiz/server')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
const SpotifyWebApi = require('spotify-web-api-node');

require('dotenv').config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});

app.get('/login', (req, res) => {
    var scopes = ['user-read-private', 'user-read-email', 'playlist-read-private', 'user-library-read'], // Add other scopes as needed
        state = 'some-state-of-my-choice';
  
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(authorizeURL);
  });

  app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;
  
    if (error) {
      console.error('Callback Error:', error);
      res.send(`Callback Error: ${error}`);
      return;
    }
  
    spotifyApi.authorizationCodeGrant(code).then(data => {
      const accessToken = data.body['access_token'];
      const refreshToken = data.body['refresh_token'];
      const expiresIn = data.body['expires_in'];
  
      spotifyApi.setAccessToken(accessToken);
      spotifyApi.setRefreshToken(refreshToken);
  
      
      console.log('access_token:', accessToken);
      console.log('refresh_token:', refreshToken);
  
     
      res.send('Success! You can now close this window.');
    }).catch(error => {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
    });
  });
  
  async function fetchSavedAlbums(accessToken) {
    const url = 'https://api.spotify.com/v1/me/albums';
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };
  
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(data); 
    } catch (error) {
      console.error('Error fetching saved albums:', error);
    }
  }
  
  async function fetchTopArtists(accessToken) {
    const url = 'https://api.spotify.com/v1/me/top/artists';
    try {
      const artists = await fetchAllPages(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return artists; 
    } catch (error) {
      console.error('Error fetching top artists:', error);
      throw error; 
    }
  }
  
  
  async function fetchTopTracks(accessToken) {
    const url = 'https://api.spotify.com/v1/me/top/tracks';
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };
  
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(data); 
    } catch (error) {
      console.error('Error fetching top tracks:', error);
    }
  }
  
  async function fetchUserPlaylists(accessToken, userId) {
    const url = `https://api.spotify.com/v1/users/${userId}/playlists`;
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };
  
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Error fetching user playlists:', error);
    }
  }

  function formatAddedAtDate(addedAt) {
    const date = new Date(addedAt);
    const month = date.getMonth() + 1; 
    const year = date.getFullYear();
  
   
    const formattedMonth = month < 10 ? `0${month}` : month;
  
    
    return `${formattedMonth}-${year}`;
  }
  const axios = require('axios'); 

async function fetchPlaylistTracks(accessToken, playlistId) {
  const tracks = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

  try {
    while (url) {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      tracks.push(...response.data.items);
      url = response.data.next; 
    }
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
  }

  return tracks.map(track => track.added_at);
}

function calculateAverageDate(dates) {
    const timestamps = dates.map(date => new Date(date).getTime());
    const averageTimestamp = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;
    return new Date(averageTimestamp);
  }
  
  async function fetchAverageAddedAtDateForPlaylist(accessToken, playlistId) {
    const addedAtDates = await fetchPlaylistTracks(accessToken, playlistId);
    const averageDate = calculateAverageDate(addedAtDates);
    console.log(`Average date added for playlist ${playlistId}:`, averageDate.toISOString());
  }

  const axios = require('axios');

async function fetchPlaylistTracksAddedDate(accessToken, playlistId) {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  const options = {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  };

  try {
    const response = await axios.get(url, options);
    const tracksAddedDates = response.data.items.map(item => ({
      trackName: item.track.name,
      addedAt: item.added_at
    }));
    console.log(tracksAddedDates);
    return tracksAddedDates; 
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
  }
}

const axios = require('axios');

async function makeSpotifyRequest(url, options) {
  try {
    return await axios.get(url, options);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      
      const retryAfter = parseInt(error.response.headers['retry-after'], 10);
      console.log(`Rate limit reached. Retrying after ${retryAfter} seconds.`);
     
      await new Promise(resolve => setTimeout(resolve, (retryAfter + 1) * 1000));
      
      return makeSpotifyRequest(url, options);
    } else {
 
      throw error;
    }
  }
}

async function fetchAllPages(url, options) {
  let results = [];
  let nextPageUrl = url;

  while (nextPageUrl) {
    const response = await makeSpotifyRequest(nextPageUrl, options);
    results = results.concat(response.data.items);
    nextPageUrl = response.data.next;
  }

  return results;
}
const axios = require('axios');

async function refreshAccessToken(refreshToken) {
  const authOptions = {
    method: 'POST',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: `grant_type=refresh_token&refresh_token=${refreshToken}`,
    json: true
  };

  try {
    const response = await axios(authOptions);
    const accessToken = response.data.access_token;
    const expiresIn = response.data.expires_in;

 
    return { accessToken, expiresIn };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}
async function fetchSpotifyData(url, accessToken) {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Spotify API request failed with status ${response.status}`);
  }

  const data = await response.json();


  if (!data.items || !Array.isArray(data.items)) {
    throw new Error('Unexpected Spotify API response structure');
  }

  return data.items;
}
function generateQuestionFromTracks(savedTracks) {
 
  const randomIndex = Math.floor(Math.random() * savedTracks.length);
  const selectedTrack = savedTracks[randomIndex];


  const addedAtDate = new Date(selectedTrack.added_at);
  const month = addedAtDate.toLocaleString('default', { month: 'long' });
  const year = addedAtDate.getFullYear();

  const question = `In which month and year did you add '${selectedTrack.track.name}' by '${selectedTrack.track.artists[0].name}' to your favorites?`;
  const answer = `${month} ${year}`;

  return { question, answer };
}

function generatePlaylistQuestion(userPlaylists) {
  
  const randomIndex = Math.floor(Math.random() * userPlaylists.length);
  const selectedPlaylist = userPlaylists[randomIndex];

  const createdDate = new Date(selectedPlaylist.created_at);
  const month = createdDate.toLocaleString('default', { month: 'long' });
  const year = createdDate.getFullYear();

  const creationQuestion = `In which month and year was your playlist '${selectedPlaylist.name}' created?`;
  const creationAnswer = `${month} ${year}`;

  const tracksQuestion = `How many tracks are in your playlist '${selectedPlaylist.name}'?`;
  const tracksAnswer = `${selectedPlaylist.tracks.total}`;


  if (Math.random() < 0.5) {
    return { question: creationQuestion, answer: creationAnswer };
  } else {
    return { question: tracksQuestion, answer: tracksAnswer };
  }
}
async function generateTopArtistQuestion(accessToken) {
  try {
    const topArtists = await fetchTopArtists(accessToken);
    if (topArtists.length === 0) {
      return { question: "You don't have any top artists.", answer: '' };
    }
    const randomIndex = Math.floor(Math.random() * topArtists.length);
    const artist = topArtists[randomIndex];

    const question = `What's one of the genres associated with ${artist.name}?`;
    const answer = artist.genres[0]; 

    return { question, answer };
  } catch (error) {
    console.error('Error generating artist question:', error);
    return { question: 'An error occurred', answer: '' };
  }
}
app.get('/api/generate-question', async (req, res) => {
  const questionData = await generateQuestion();
  res.json(questionData);
});

async function generateUnifiedQuestion(accessToken) {
 
  const questionTypes = ['topArtists', 'playlists', 'topTracks'];
  const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

  switch (selectedType) {
      case 'topArtists':
          return await generateTopArtistQuestion(accessToken);
      case 'playlists':
          
          return await generatePlaylistQuestion(accessToken);
      case 'topTracks':
          
          return await generateTopTracksQuestion(accessToken);
      default:
          throw new Error('Invalid question type selected');
  }
}

app.get('/api/generate-question', async (req, res) => {
  
  const accessToken = req.session.accessToken; 

  try {
      const questionData = await generateUnifiedQuestion(accessToken);
      res.json(questionData);
  } catch (error) {
      console.error('Error generating question:', error);
      res.status(500).json({ message: 'Failed to generate question' });
  }
});
