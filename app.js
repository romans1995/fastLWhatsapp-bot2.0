const qrcode = require('qrcode-terminal');

const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const client = new Client({
    authStrategy: new LocalAuth()
});
 
const http = require('http');

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("server is runing")
});


const urlBase = 'http://localhost:3000/search/';
async function testAxios(url) {
    try {
        const response = await axios.get(url, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}


function spacer(text){
    // Regular expression to match phone numbers and email addresses
    var regex = /(\d{3}-\d{3}-\d{4}|\d{10}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/g;
    
    // Array to store phone numbers and email addresses found in the text
    var matches = [];
    var match;
    
    // Find all matches of phone numbers and email addresses in the text
    while ((match = regex.exec(text)) !== null) {
        matches.push(match);
    }
    
    // Replace dots with '.\n' except within phone numbers or email addresses
    text = text.replace(/\./g, function(match, offset) {
       
        for (var i = 0; i < matches.length; i++) {
            if (offset >= matches[i].index && offset < matches[i].index + matches[i][0].length) {
                // Dot is within a phone number or email address, so return the original dot
                return match;
            }
        }
        return '.\n';
    });
    
    // Replace forward slashes and backward slashes with newlines
    text = text.replace(/[\/\\]/g, '\n');
    
    return text;
}

function applyCustomFormatting(text) {
    return `*${text}*`;
}
const specificNumber = "972548293494@c.us"; 
client.on('message', async msg => {
    if(msg.from === specificNumber){
  
        msg.reply("loading...");
        if (msg.body === 'search') {
            msg.reply("what are you searching for ?");
    
     const queryHandler = async queryMsg => {
                const query = queryMsg.body;
                const url = `${urlBase}${query}`;
                try {
                    let data = await testAxios(url);
                    data.length === 0 ?msg.reply("לא נמצאו תוצאות"):
                    data.forEach(element => {
                        let electricalCabinet = Array.isArray(element.electricalCabinet) ? element.electricalCabinet.join(', ') : element.electricalCabinet;
                        let ld = Array.isArray(element.devices?.ld) ? element.devices.ld.join(', ') : '';
                        let vms = Array.isArray(element.devices?.vms) ? element.devices.vms.join(', ') : '';
                        const dataArray = Object.entries(element);
                        let organizedData = `name: ${element.name }\n` + 
                                            `location: ${element.location || 'N/A'}\n` +
                                            `district: ${element.district || 'N/A'}\n` +
                                            `contract-number: ${element['contract-number'] || 'N/A'}\n` +
                                            `Counter-number: ${element['Counter-number'] || 'N/A'}\n` +
                                            `electricalCabinet: ${electricalCabinet || 'N/A'}\n` +
                                            `ld: ${ld || 'N/A'}\n` +
                                            `vms: ${vms || 'N/A'}\n` +
                                            `urgency: ${element.urgency || 'N/A'}\n` +
                                            `discription: ${element.discription || 'N/A'}\n` +
                                            `id: ${element.id || 'N/A'}`;
                        console.log(dataArray,"line 83");
                        msg.reply(organizedData);
                    });
                } catch (error) {
                    console.error('Error:', error.message);
                    msg.reply('לא נמצאו תוצאות');
                }
    
                // Remove the event listener after processing the query
                client.removeListener('message', queryHandler);
            };
    
            // Register the event listener for the query message
            client.on('message', queryHandler);
        }



     
        let urlShilut;

        switch (msg.body) {
            case "1":
                urlShilut = 'http://localhost:3000/students/';
                break;
            case "2":
                urlShilut = 'http://localhost:3000/shiluthafala/';
                break;
        }
        try {
            const data = await testAxios(urlShilut);
            // Check if data is an array
           
            if (data.length > 1){
                // Iterate over each object in the array
                for (const obj of data) {
                    // Process each object individually
                    await processObject(obj, msg);
                    console.log("obj");
                }
            } else {
                // If data is not an array, process it as a single object
                await processObject(data, msg);
                console.log("data");
            }
        } catch (error) {
            console.error('Error:', error.message);
            // Send error message as a reply to the original message
            msg.reply(` ${new Error().stack.split('\n')[2].trim()} לא נמצאו תוצאות`);
        }
        }
       
});

async function processObject(data, msg) {
    let messages = [];
    const firstObjectKeys = Object.keys(data)[0];
    if (firstObjectKeys) {
        messages.push(`${applyCustomFormatting(firstObjectKeys)} ${'\n'}`);
    }
    Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([innerKey, innerValue]) => {
                if (typeof innerValue === 'object' && innerValue !== null) {
                    Object.entries(innerValue).forEach(([innerInKey, innerInValue]) => {
                        messages.push(`${applyCustomFormatting(innerInKey)}: ${spacer(innerInValue)} ${'\n'}`);
                    });
                } else {
                    messages.push(`${applyCustomFormatting(innerKey)}: ${spacer(innerValue)}`);
                }
            });
        } else {
            messages.push(`${applyCustomFormatting(key)}: ${spacer(value)}`);
        }
    });
    // Join all formatted messages with newline characters
    const finalMessage = messages.join('\n');
    // console.log("finalMessage", finalMessage);
    // Send the final message as a reply
    msg.reply(finalMessage);
}

client.initialize();
