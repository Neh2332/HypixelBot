require('dotenv').config();
const axios = require('axios');
const { Client, GatewayIntentBits, CommandInteraction, ContextMenuInteraction } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates]
});

client.once('ready', () => {
    console.log('Bot is ready!');

    // Define the 'roll a dice' command
    const rollDiceCommand = {
        name: 'roll_a_dice',
        description: 'Rolls a dice',
    };

    // Define the 'warp to deep caverns' command
    const warpdeepcommand = {
        name: 'warpdeep',
        description: 'Warps to Deep Caverns for Share EXP core',
    };

    // Define the 'flip a coin' command
    const flipCoinCommand = {
        name: 'flip_a_coin',
        description: 'Flips a coin',
    };


    // Define the 'get skyblock data' command
     // Define the 'get skyblock data' command
     const skyblock = {
        name: 'skyblock',
        description: 'Gets data about your SkyBlock player',
        options: [
            {
                name: 'username',
                type: 3,  // Use 3 for STRING type
                description: 'Your Minecraft username',
                required: true,
            },
        ],
    };
    
    // Define the 'get_top_auctions' command
const AuctionsCommand = {
    name: 'skyblockauctions',
    description: 'Gets the top 20 cheapest auction listings',
    options: [
        {
            name: 'min_price',
            type: 4,  // INTEGER type
            description: 'Minimum price',
            required: false,
        },
        {
            name: 'max_price',
            type: 4,  // INTEGER type
            description: 'Maximum price',
            required: false,
        },
        {
            name: 'name',
            type: 3,  // STRING type
            description: 'Specific item name',
            required: false,
        },
        {
            name: 'playername',
            type: udername,  // STRING type
            description: 'Finds listing of a player',
            required: false,
        },
    ],
};



    // Register the commands with Discord
    client.guilds.cache.get('1038256817580539984').commands.set([rollDiceCommand, flipCoinCommand, warpdeepcommand, skyblock, AuctionsCommand]);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    try {
        if (commandName === 'skyblock') {
            const username = interaction.options.getString('username');
            const mojangResponse = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
            const uuid = mojangResponse.data.id;
        
            // Get a list of all SkyBlock profiles for the player
            const profilesResponse = await axios.get(`https://api.hypixel.net/skyblock/profiles?key=${process.env.HYPIXEL_API_KEY}&uuid=${uuid}`);
            const profiles = profilesResponse.data.profiles;
        
            if (!profiles || profiles.length === 0) {
                await interaction.reply(`No SkyBlock profiles found for ${username}`);
                return;
            }
        
            // Choose the first profile in the list
            const profile = profiles[0];
            const profileId = profile.profile_id;
        
            // Get the data for the chosen profile
            const hypixelResponse = await axios.get(`https://api.hypixel.net/skyblock/profile?key=${process.env.HYPIXEL_API_KEY}&profile=${profileId}`);
            const data = hypixelResponse.data;

            // Extract more detailed data
            const profileData = data.profile;
            const members = profileData.members;
            const member = members[uuid];
            const playerData = member;


            // Get the player's purse
            const purse = playerData.coin_purse;

            // Get players banking balance
            const banking = data.profile.banking.balance;
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              });

            //display the purse
            await interaction.reply(`${username}'s Stats\n\nPurse: ${formatter.format(purse)}\nBanking: ${formatter.format(banking)}`);
            //copy the above line and round the numbers to 2 decimal places
        

        }      
                 else if (commandName === 'skyblockauctions') {
                    // Acknowledge the interaction immediately with a deferred reply
                    await interaction.deferReply();
                
                    // Get the command options
                    const minPrice = interaction.options.getInteger('min_price');
                    const maxPrice = interaction.options.getInteger('max_price');
                    const type = interaction.options.getString('name');
                    const playername = interaction.options.getString('playername');
                
                    let allAuctions = [];
                
                    // Fetch data from all pages
                    for (let page = 0; page < 60; page++) {
                        const auctionsResponse = await axios.get(`https://api.hypixel.net/skyblock/auctions?key=${process.env.HYPIXEL_API_KEY}&page=${page}`);
                        allAuctions = allAuctions.concat(auctionsResponse.data.auctions);
                    }
                
                    // Filter 'BIN' (Buy It Now) auctions based on the command options
                    const binAuctions = allAuctions.filter(auction => 
                        auction.bin &&
                        auction.starting_bid > 0 &&
                        (!minPrice || auction.starting_bid >= minPrice) &&
                        (!maxPrice || auction.starting_bid <= maxPrice) &&
                        (!type || auction.item_name.toLowerCase().includes(type.toLowerCase())) &&
                        (!playername || auction.profile_id.toLowerCase().includes(playername.toLowerCase()))
                    );

                    
                    // Sort the auctions by highest bid and take the bottom 20
                    const botAuctions = binAuctions.sort((a, b) => a.starting_bid - b.starting_bid).slice(0, 20);
                
                    // Format the auction data
                    const auctionData = botAuctions.map((auction, index) => 
                        `#${index + 1}: ${auction.item_name} - Buy It Now Price: ${auction.starting_bid} coins`
                    );
                
                    // Split the data into chunks of 10 items each
                    const chunks = [];
                    for (let i = 0; i < auctionData.length; i += 10) {
                        chunks.push(auctionData.slice(i, i + 10));
                    }
                
                    // Send the data as a follow-up message to the deferred reply
                    await interaction.editReply(`BIN Auction Listings for ${type} with prices between ${minPrice} and ${maxPrice}:\n${chunks[0].join('\n')}`);
                
                    // Send the remaining data as follow-up messages
                    for (let i = 1; i < chunks.length; i++) {
                        await interaction.followUp(chunks[i].join('\n'));
                    }
                }
                



         else if (commandName === 'warpdeep') {
            await interaction.reply('Warping to Deep Caverns...');
            await interaction.member.voice.setChannel('1196901983454515300');
            await interaction.followUp('Warped to Deep Caverns!');
        } else if (commandName === 'roll_a_dice') {
            const roll = Math.floor(Math.random() * 6) + 1;
            await interaction.reply(`You rolled a: ${roll}`);
        } else if (commandName === 'flip_a_coin') {
            const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
            await interaction.reply(`It is: ${result}`);
        }
    } catch (error) {
        console.error(`Error executing command "${commandName}":`, error);
        await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
    }
});


client.login(process.env.DISCORD_TOKEN);
