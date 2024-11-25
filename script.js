
let userContext = {
    interest: null,
    budget: null,
    stage: 'initial',
    selectedPlaces: [],
};

// Function to check if the user is greeting
function isGreeting(message) {
    const greetings = ["hi", "hello", "hey", "greetings", "howdy", "morning", "evening"];
    return greetings.some(greeting => message.toLowerCase().includes(greeting));
}

function addMessageToChat(sender, message) {
    const chatBox = document.querySelector('.chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + sender;
    messageDiv.innerHTML = message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function handleUserInput() {
    const inputField = document.querySelector('.input-area input');
    const userMessage = inputField.value.trim();

    if (userMessage) {
        addMessageToChat('user', userMessage);
        inputField.value = '';

        generateBotResponse(userMessage);
    }
}

function generateBotResponse(userMessage = '') {
    let botResponse = "";

    // Check if the user is greeting
    if (isGreeting(userMessage) && userContext.stage === 'initial') {
        botResponse = "Hello! How can I assist you with your trip planning today?";
        setTimeout(() => addMessageToChat('bot', botResponse), 1000);
        return;
    }

    switch (userContext.stage) {
        case 'initial':
            botResponse = "Hello! Tell me about the kind of trip you're looking for. You can describe it in your own words.";
            userContext.stage = 'awaitingInterest';
            break;

        case 'awaitingInterest':
            if (userMessage) {
                const validInterests = ["beach", "mountain", "city"];
                const matchedInterest = validInterests.find(interest => userMessage.toLowerCase().includes(interest));

                if (matchedInterest) {
                    userContext.interest = matchedInterest;
                    botResponse = `Got it! You want to visit a ${matchedInterest} destination. What's your budget for this trip? Please enter an amount in dollars.`;
                    userContext.stage = 'awaitingBudget';
                } else {
                    botResponse = "Hmm, I didn't quite understand. Could you tell me more about the kind of trip you're looking for? Try mentioning a type like 'beach', 'mountain', 'city', etc.";
                }
            } else {
                botResponse = "Please tell me more about the kind of trip you're interested in.";
            }
            break;

            case 'awaitingBudget':
                // Ensure the input contains a dollar sign and a valid number
                if (userMessage.includes('$')) {
                    const cleanedInput = userMessage.replace(/\s+/g, '').replace('$', '');
                    const budgetAmount = parseFloat(cleanedInput);
            
                    if (!isNaN(budgetAmount) && budgetAmount > 0) {
                        userContext.budget = budgetAmount;
                        const suggestions = getSuggestedPlaces(userContext.interest, userContext.budget);
                        botResponse = `Here are some suggestions for your budget of $${budgetAmount}:\n${suggestions}`;
                        userContext.stage = 'selectingPlaces';
                    } else {
                        botResponse = "Please enter a valid budget with a dollar symbol, e.g., '$500'.";
                    }
                } else {
                    botResponse = "Please include a dollar symbol ('$') when entering your budget, e.g., '$500'.";
                }
                break;
            

        case 'itineraryStage':
            const selectedPlaces = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(
                input => input.value
            );

            if (selectedPlaces.length > 0) {
                userContext.selectedPlaces = selectedPlaces;
                botResponse = generateItinerary(userContext.interest, userContext.budget, selectedPlaces);
                botResponse += generateBookingLinks();
                botResponse += "<p>Feel free to reach out again if you need more help! Have a wonderful trip!</p>";
                userContext.stage = 'initial'; // Reset stage for a new interaction
            } else {
                botResponse = "Please select at least one place to create an itinerary.";
            }
            break;

        default:
            botResponse = "I'm here to help! Please start by telling me what kind of trip you're looking for.";
            userContext.stage = 'initial';
            break;
    }

    setTimeout(() => addMessageToChat('bot', botResponse), 1000);
}

function getSuggestedPlaces(interest, budget) {
    const mockData = {
        "beach": {
            low: ["Goa, India", "Tulum, Mexico", "Bali, Indonesia","Phuket, Thailand", "Sri Lanka", "Varkala, India", "Kovalam, India", "Kanyakumari, India"],
            medium: ["Maui, Hawaii", "Phuket, Thailand", "Malaga, Spain", "Zanzibar, Tanzania", "Koh Samui, Thailand", "Gokarna, India", "Rishikonda Beach, India", "Alleppey, India"],
            high: ["Maldives", "Seychelles", "Bora Bora","The Great Barrier Reef", "Santorini, Greece", "Kumarakom, India", "Andaman Islands, India"]
        },
        "mountain": {
            low: ["Kasol, India", "Rocky Mountains, USA", "Himalayas, Nepal","Coorg, India", "Wayanad, India", "Nilgiris, India"],
            medium: ["Swiss Alps", "Banff, Canada", "Dolomites, Italy","Pyrenees, Spain", "Munnar, India", "Ooty, India", "Kodaikanal, India"],
            high: ["Aspen, USA", "Whistler, Canada", "Mont Blanc, France","The Alps, Switzerland", "Kilimanjaro, Tanzania", "Annapurna Circuit, Nepal"]
        },
        "city": {
            low: ["Bangkok, Thailand", "Mexico City, Mexico", "Istanbul, Turkey","Delhi, India", "Lagos, Nigeria", "Chennai, India", "Hyderabad, India", "Bangalore, India"],
            medium: ["New York, USA", "London, UK", "Barcelona, Spain","Rome, Italy", "Cape Town, South Africa", "Kochi, India", "Pune, India", "Jaipur, India"],
            high: ["Tokyo, Japan", "Paris, France", "Dubai, UAE","Singapore", "Sydney, Australia", "Mumbai, India", "Delhi, India"]
        }
    };

    const priceRange = budget < 500 ? "low" : budget <= 1500 ? "medium" : "high";

    const suggestedPlaces = mockData[interest][priceRange];
    const suggestionHTML = suggestedPlaces.map(
        place => `<li><input type="checkbox" value="${place}"> ${place}</li>`
    ).join('');

    return `
        <p><strong>Suggested Places:</strong></p>
        <ul style="list-style: none; padding: 0;">${suggestionHTML}</ul>
        <button id="confirm-places">Confirm Selection</button>
    `;
}

function generateItinerary(interest, budget, selectedPlaces) {
    const hotelRecommendations = {
        low: ["Budget Inn", "Cozy Lodge", "Economy Stay"],
        medium: ["Comfort Suites", "Holiday Resort", "Midtown Hotel"],
        high: ["Luxury Palace", "Grand Hotel", "Premium Stay"]
    };

    const priceRange = budget < 500 ? 'low' : budget <= 1500 ? 'medium' : 'high';

    const uniqueHotels = Array.from(new Set(hotelRecommendations[priceRange]));

    const tableStyle = `
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 1.1em;
            font-family: 'Poppins', sans-serif;
            text-align: left;
            border-radius: 8px;
            overflow: hidden;
            background-color: #141414; /* Netflix dark background */
            color: #ffffff; /* White text for contrast */
        }
        th, td {
            padding: 12px 15px;
            border: 1px solid #333333; /* Dark border for seamless design */
        }
        th {
            background-color: #e50914; /* Netflix red for headers */
            color: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
        }
        tr:nth-child(even) {
            background-color: #333333; /* Dark grey for even rows */
        }
        tr:hover {
            background-color: #444444; /* Lighter grey on hover for rows */
        }
        td {
            font-size: 1em;
        }
    </style>
`;

let tableHTML = `
    ${tableStyle}
    <table>
        <thead>
            <tr>
                <th>Place to Visit</th>
                <th>Recommended Hotel</th>
                <th>Budget Range</th>
            </tr>
        </thead>
        <tbody>`;

    selectedPlaces.forEach((place, index) => {
        const hotel = uniqueHotels[index % uniqueHotels.length];
        tableHTML += `
            <tr>
                <td>${place}</td>
                <td>${hotel}</td>
                <td>${priceRange.charAt(0).toUpperCase() + priceRange.slice(1)}</td>
            </tr>`;
    });

    tableHTML += `
            </tbody>
        </table>
        <p style="font-size: 1.2em; margin-top: 20px;">Enjoy your trip!</p>
    `;
    const travelAlertsAndTips = generateTravelAlertsAndTips(selectedPlaces, interest);
    tableHTML += travelAlertsAndTips;


    return tableHTML;
}

function generateBookingLinks() {
    return `
        <p>To book your flights and accommodations, you can visit the following links:</p>
        <ul style="list-style: none; padding: 0;">
            <li><a href="https://www.expedia.com/" target="_blank" style="color: #e50914; font-weight: bold; text-decoration: none; transition: color 0.3s ease;">Book Flights and Hotels on Expedia</a></li>
            <li><a href="https://www.booking.com/" target="_blank" style="color: #e50914; font-weight: bold; text-decoration: none; transition: color 0.3s ease;">Find Hotels on Booking.com</a></li>
            <li><a href="https://www.kayak.com/" target="_blank" style="color: #e50914; font-weight: bold; text-decoration: none; transition: color 0.3s ease;">Search for Flights on Kayak</a></li>
            <li><a href="https://www.airbnb.com/" target="_blank" style="color: #e50914; font-weight: bold; text-decoration: none; transition: color 0.3s ease;">Explore Stays on Airbnb</a></li>
        </ul>
    `;
}


document.querySelector('.input-area button').addEventListener('click', handleUserInput);
document.querySelector('.input-area input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    generateBotResponse();
});

// Event listener for Confirm Selection button
document.addEventListener('click', function (event) {
    if (event.target.id === 'confirm-places') {
        userContext.stage = 'itineraryStage';
        generateBotResponse();
    }
});

// Function to generate shareable chat link
function generateChatLink() {
    const chatBox = document.querySelector('.chat-box');
    const messages = Array.from(chatBox.querySelectorAll('.message')).map(msg => ({
        sender: msg.className.includes('user') ? 'user' : 'bot',
        text: msg.innerText
    }));
    
    const encodedChat = encodeURIComponent(JSON.stringify(messages));
    const shareableLink = `${window.location.origin}${window.location.pathname}?chat=${encodedChat}`;
    return shareableLink;
}

// Function to share on WhatsApp
function shareOnWhatsApp() {
    const link = generateChatLink();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
        "Check out my chat with the Travel Planner Bot: " + link
    )}`;
    window.open(whatsappUrl, '_blank');
}

// Function to share on Twitter
function shareOnTwitter() {
    const link = generateChatLink();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        "Check out my chat with the Travel Planner Bot: " + link
    )}`;
    window.open(twitterUrl, '_blank');
}

// Attach event listeners
document.getElementById('share-whatsapp').addEventListener('click', shareOnWhatsApp);
document.getElementById('share-twitter').addEventListener('click', shareOnTwitter);

// Load and display chat if accessed via a shared link
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const chatData = urlParams.get('chat');

    if (chatData) {
        const messages = JSON.parse(decodeURIComponent(chatData));
        const chatBox = document.querySelector('.chat-box');
        chatBox.innerHTML = ''; // Clear existing content

        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}`;
            messageDiv.innerText = msg.text;
            chatBox.appendChild(messageDiv);
        });

        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
    }
});

// Function to restore chat from URL
function restoreChatFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const chatData = urlParams.get('chat'); // Get the 'chat' parameter
    if (chatData) {
        try {
            const messages = JSON.parse(decodeURIComponent(chatData)); // Decode and parse chat data
            const chatBox = document.querySelector('.chat-box');

            // Clear existing chat messages
            chatBox.innerHTML = '';

            // Re-render the chat messages
            messages.forEach((msg) => {
                const messageElement = document.createElement('div');
                messageElement.className = `message ${msg.sender}`; // 'user' or 'bot'
                messageElement.innerText = msg.text;
                chatBox.appendChild(messageElement);
            });
        } catch (e) {
            console.error('Error decoding chat data:', e);
        }
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', restoreChatFromURL);


function generateTravelAlertsAndTips(selectedPlaces, interest) {
    // Example alerts and tips based on the user's selected interest or destinations
    const generalTips = [
        "Always carry a reusable water bottle to stay hydrated.",
        "Pack light and smart for convenience.",
        "Keep a digital copy of important documents like passports and tickets.",
        "Check local COVID-19 guidelines before traveling."
    ];

    const interestSpecificTips = {
        beach: [
            "Carry sunscreen and sunglasses to protect against UV rays.",
            "Don't forget flip-flops and beachwear for comfort.",
            "Check tide timings if planning activities like swimming."
        ],
        mountain: [
            "Pack warm clothes and sturdy shoes for hiking.",
            "Carry a first-aid kit and snacks for long treks.",
            "Check the weather forecast to avoid bad conditions."
        ],
        city: [
            "Carry a map or download offline maps for navigation.",
            "Beware of pickpockets in crowded areas.",
            "Check for city passes to save on attractions and transport."
        ]
    };

    // Alerts about specific places
    const placeAlerts = selectedPlaces.map(place => `For ${place}: Check travel advisories and local guidelines.`);

    // Combine all relevant tips
    const tips = [
        "<strong>General Travel Tips:</strong>",
        ...generalTips.map(tip => `<li>${tip}</li>`),
        `<strong>${interest.charAt(0).toUpperCase() + interest.slice(1)} Travel Tips:</strong>`,
        ...interestSpecificTips[interest].map(tip => `<li>${tip}</li>`),
        "<strong>Place-Specific Alerts:</strong>",
        ...placeAlerts.map(alert => `<li>${alert}</li>`)
    ].join('');

    return `<p><strong>Travel Alerts and Tips:</strong></p><ul style="list-style: none; padding: 0;">${tips}</ul>`;
}
