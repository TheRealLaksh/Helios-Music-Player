// ==========================================================================
// Helios — music library
// Shared by the landing page (cover wall, counts) and the player.
// Audio:  Assets/music/<name>.mp3     Cover: Assets/images/<cover>.jpg
// ==========================================================================
(function () {
    var playlists = [
        {
            id: 'english', name: 'English', tagline: 'Pop, hip-hop and everything you sing along to',
            songs: [
                { name: 'azizam', displayName: 'Azizam', artist: 'Ed Sheeran', cover: 'azizam' },
                { name: 'badhabits', displayName: 'Bad Habits', artist: 'Ed Sheeran', cover: 'badhabits' },
                { name: 'band4band', displayName: 'Band4Band', artist: 'Central Cee & Lil Baby', cover: 'band4band' },
                { name: 'camera', displayName: 'Camera', artist: 'Ed Sheeran', cover: 'camera' },
                { name: 'cold', displayName: 'Cold - R3hab & Khrebto Remix', artist: 'Maroon 5, Future, R3HAB, Khrebto', cover: 'cold' },
                { name: 'doja', displayName: 'Doja', artist: 'Central Cee', cover: 'doja' },
                { name: 'dtmf', displayName: 'DTMF', artist: 'Bad Bunny', cover: 'dtmf' },
                { name: 'flatline', displayName: 'Flatline', artist: 'Justin Bieber', cover: 'flatline' },
                { name: 'followyou', displayName: 'Follow You', artist: 'Imagine Dragons', cover: 'followyou' },
                { name: 'ghost', displayName: 'Ghost', artist: 'Justin Bieber', cover: 'ghost' },
                { name: 'godsplan', displayName: 'God\'s Plan', artist: 'Drake', cover: 'godsplan' },
                { name: 'hometownsmile', displayName: 'Hometown Smile', artist: 'Bahjat', cover: 'hometownsmile' },
                { name: 'howlong', displayName: 'How Long', artist: 'Charlie Puth', cover: 'howlong' },
                { name: 'hymnfortheweekend', displayName: 'Hymn for the Weekend', artist: 'Coldplay', cover: 'hymnfortheweekend' },
                { name: 'idontcare', displayName: 'I Don\'t Care', artist: 'Ed Sheeran & Justin Bieber', cover: 'idontcare' },
                { name: 'ilikemebetter', displayName: 'I Like Me Better', artist: 'Lauv', cover: 'ilikemebetter' },
                { name: 'imsotired', displayName: 'i\'m so tired...', artist: 'Lauv & Troye Sivan', cover: 'imsotired' },
                { name: 'lostinyou', displayName: 'Lost in You', artist: 'khai dreams', cover: 'lostinyou' },
                { name: 'mexico', displayName: 'Mexico', artist: 'Shotgun Willy', cover: 'mexico' },
                { name: 'numb', displayName: 'Numb', artist: 'Marshmello', cover: 'numb' },
                { name: 'ordinary', displayName: 'Ordinary', artist: 'Alex Warren', cover: 'ordinary' },
                { name: 'parisintherain', displayName: 'Paris in the Rain', artist: 'Lauv', cover: 'parisintherain' },
                { name: 'perfect', displayName: 'Perfect', artist: 'Ed Sheeran', cover: 'perfect' },
                { name: 'photograph', displayName: 'Photograph', artist: 'Ed Sheeran', cover: 'photograph' },
                { name: 'run', displayName: 'Run', artist: 'OneRepublic', cover: 'run' },
                { name: 'sapphire', displayName: 'Sapphire', artist: 'Ed Sheeran', cover: 'sapphire' },
                { name: 'selflove', displayName: 'Self Love', artist: 'Metro Boomin, Coi Leray', cover: 'selflove' },
                { name: 'shapeofyou', displayName: 'Shape of You', artist: 'Ed Sheeran', cover: 'shapeofyou' },
                { name: 'shivers', displayName: 'Shivers', artist: 'Ed Sheeran', cover: 'shivers' },
                { name: 'somethingjustlikethis', displayName: 'Something Just Like This', artist: 'The Chainsmokers & Coldplay', cover: 'somethingjustlikethis' },
                { name: 'sprinter', displayName: 'Sprinter', artist: 'Dave & Central Cee', cover: 'sprinter' },
                { name: 'thinkingoutloud', displayName: 'Thinking Out Loud', artist: 'Ed Sheeran', cover: 'thinkingoutloud' },
                { name: 'thriftshop', displayName: 'Thrift Shop', artist: 'Macklemore & Ryan Lewis', cover: 'thriftshop' },
                { name: 'whichone', displayName: 'Which One', artist: 'Drake & Central Cee', cover: 'whichone' },
                { name: 'youngblood', displayName: 'Youngblood', artist: '5 Seconds of Summer', cover: 'youngblood' },
            ]
        },
        {
            id: 'punjabi', name: 'Punjabi', tagline: 'Bass, swagger and late-night drives',
            songs: [
                { name: '3peg', displayName: '3 Peg', artist: 'Sharry Mann', cover: '3peg' },
                { name: '945', displayName: '9:45', artist: 'Prabh Singh, Jay Trak, Rooh Sandhu', cover: '945' },
                { name: 'admirinyou', displayName: 'Admirin\' You', artist: 'Karan Aujla', cover: 'admirinyou' },
                { name: 'baawe', displayName: 'Baawe', artist: 'AP Dhillon', cover: 'baawe' },
                { name: 'bemine', displayName: 'Be Mine', artist: 'AP Dhillon', cover: 'bemine' },
                { name: 'daaku', displayName: 'Daaku', artist: 'Badshah, Sharvi Yadav, Hiten', cover: 'daaku' },
                { name: 'darji', displayName: 'Darji', artist: 'Prabh Singh & Rooh Sandhu', cover: 'darji' },
                { name: 'excuses', displayName: 'Excuses', artist: 'AP Dhillon, Gurinder Gill, Intense', cover: 'excuses' },
                { name: 'loveya', displayName: 'Love Ya', artist: 'Karan Aujla', cover: 'loveya' },
                { name: 'magic', displayName: 'Magic', artist: 'AP Dhillon', cover: 'magic' },
                { name: 'millionaire', displayName: 'Millionaire', artist: 'Yo Yo Honey Singh, Simar Kaur, Singhsta', cover: 'millionaire' },
                { name: 'obsessed', displayName: 'Obsessed', artist: 'Riar Saab, Abhijay Sharma', cover: 'obsessed' },
                { name: 'oldmoney', displayName: 'Old Money', artist: 'Karan Aujla, Ikky', cover: 'oldmoney' },
                { name: 'stfu', displayName: 'STFU', artist: 'Karan Aujla, Yeah Proof', cover: 'stfu' },
                { name: 'thodisidaaru', displayName: 'Thodi Si Daaru', artist: 'AP Dhillon & Shreya Ghoshal', cover: 'thodisidaaru' },
                { name: 'toxic', displayName: 'Toxic', artist: 'AP Dhillon, Gurinder Gill, Gminxr', cover: 'toxic' },
                { name: 'truestories', displayName: 'True Stories', artist: 'AP Dhillon, Gurinder Gill, Intense', cover: 'truestories' },
                { name: 'uddaapunjab', displayName: 'Ud Daa Punjab', artist: 'Amit Trivedi', cover: 'uddaapunjab' },
                { name: 'withyou', displayName: 'With You', artist: 'AP Dhillon', cover: 'withyou' },
            ]
        },
        {
            id: 'hindi', name: 'Hindi', tagline: 'Heartbreak, romance and Bollywood gold',
            songs: [
                { name: 'bhaagdkbose', displayName: 'Bhaag D.K. Bose, Aandhi Aayi', artist: 'Ram Sampath', cover: 'bhaagdkbose' },
                { name: 'bijleebijlee', displayName: 'Bijlee Bijlee', artist: 'Harrdy Sandhu', cover: 'bijleebijlee' },
                { name: 'donteventext', displayName: "Don't Even Text", artist: 'Tsumyoki & Ginni', cover: 'donteventext' },
                { name: 'faasle', displayName: 'Faasle', artist: 'Aditya Rikhari', cover: 'faasle' },
                { name: 'farebi', displayName: 'Farebi', artist: 'Chaar Diwaari & Raftaar', cover: 'farebi' },
                { name: 'haanmaingalat', displayName: 'Haan Main Galat', artist: 'Arijit Singh & Shashwat Singh', cover: 'haanmaingalat' },
                { name: 'hawayein', displayName: 'Hawayein', artist: 'Arijit Singh', cover: 'hawayein' },
                { name: 'heeriye', displayName: 'Heeriye', artist: 'Jasleen Royal & Arijit Singh', cover: 'heeriye' },
                { name: 'husn', displayName: 'Husn', artist: 'Anuv Jain', cover: 'husn' },
                { name: 'ilahi', displayName: 'Ilahi', artist: 'Arijit Singh', cover: 'ilahi' },
                { name: 'maharani', displayName: 'Maharani', artist: 'Karun ft. Arpit Bala & ReVo LEKHAK', cover: 'maharani' },
                { name: 'malang', displayName: 'Malang (Title Track)', artist: 'Ved Sharma', cover: 'malang' },
                { name: 'nashesichadhgyi', displayName: 'Nashe Si Chadh Gayi', artist: 'Arijit Singh', cover: 'nashesichadhgyi' },
                { name: 'paro', displayName: 'Paro', artist: 'Aditya Rikhari', cover: 'paro' },
                { name: 'pungi', displayName: 'Pungi', artist: 'Mika Singh, Pritam, Amitabh Bhattacharya, Nakash Aziz', cover: 'pungi' },
                { name: 'udedilbefikre', displayName: 'Ude Dil Befikre', artist: 'Benny Dayal', cover: 'udedilbefikre' },
                { name: 'wishes', displayName: 'Wishes', artist: 'Hasan Raheem ft. Talwiinder', cover: 'wishes' },
            ]
        }
    ];

    // Dominant cover colours [primary, secondary] — precomputed so theming is instant
    var colors = {"3peg":[[199,107,93],[199,165,109]],"945":[[185,68,199],[199,68,158]],"admirinyou":[[62,101,199],[81,62,199]],"azizam":[[82,129,199],[84,82,199]],"baawe":[[199,129,24],[199,59,44]],"badhabits":[[199,16,30],[247,210,9]],"band4band":[[109,167,199],[199,164,109]],"bemine":[[223,130,68],[223,195,68]],"bhaagdkbose":[[199,52,57],[199,184,109]],"bijleebijlee":[[106,183,199],[217,121,114]],"camera":[[199,46,98],[13,139,216]],"cold":[[199,161,109],[199,90,79]],"daaku":[[114,148,207],[199,77,84]],"darji":[[199,120,109],[243,226,134]],"doja":[[109,193,199],[199,146,109]],"donteventext":[[199,106,51],[199,168,51]],"dtmf":[[199,164,109],[196,199,109]],"excuses":[[199,103,164],[109,146,199]],"faasle":[[199,108,97],[66,216,233]],"farebi":[[199,122,71],[199,176,71]],"flatline":[[255,140,140],[255,188,140]],"followyou":[[71,184,199],[71,130,199]],"ghost":[[109,199,188],[109,172,199]],"godsplan":[[199,74,85],[199,116,74]],"haanmaingalat":[[199,104,188],[158,90,199]],"hawayein":[[199,125,79],[200,187,88]],"heeriye":[[199,131,93],[199,176,93]],"hometownsmile":[[199,122,109],[120,109,199]],"howlong":[[199,144,109],[196,199,109]],"husn":[[109,199,168],[109,192,199]],"hymnfortheweekend":[[39,108,200],[201,129,85]],"idontcare":[[199,137,109],[109,143,199]],"ilahi":[[199,155,81],[199,48,70]],"ilikemebetter":[[16,99,199],[16,22,199]],"imsotired":[[199,147,109],[199,185,109]],"lostinyou":[[123,109,199],[199,122,109]],"loveya":[[234,63,58],[234,137,58]],"magic":[[199,33,48],[199,88,33]],"maharani":[[199,4,3],[199,86,3]],"malang":[[39,24,199],[112,24,199]],"mexico":[[109,168,199],[199,142,107]],"millionaire":[[199,142,109],[192,199,107]],"nashesichadhgyi":[[246,17,143],[246,17,47]],"numb":[[94,182,199],[245,109,160]],"obsessed":[[19,141,199],[178,201,69]],"oldmoney":[[199,70,52],[199,132,52]],"ordinary":[[199,143,109],[199,181,109]],"parisintherain":[[24,120,199],[24,47,199]],"paro":[[199,109,109],[199,147,109]],"perfect":[[114,187,206],[114,148,206]],"photograph":[[25,199,76],[25,199,149]],"pungi":[[199,29,36],[199,93,29]],"run":[[79,124,199],[71,180,199]],"sapphire":[[81,128,199],[84,81,199]],"selflove":[[199,122,109],[109,119,199]],"shapeofyou":[[59,172,222],[59,104,222]],"shivers":[[205,22,10],[214,186,35]],"somethingjustlikethis":[[199,163,109],[197,199,109]],"sprinter":[[94,158,199],[199,53,66]],"stfu":[[229,193,126],[222,229,126]],"thinkingoutloud":[[28,199,84],[28,199,156]],"thodisidaaru":[[199,130,88],[199,177,88]],"thriftshop":[[199,129,96],[109,159,199]],"toxic":[[199,32,40],[199,94,32]],"truestories":[[199,154,87],[58,141,199]],"uddaapunjab":[[199,112,100],[199,82,124]],"udedilbefikre":[[220,101,149],[235,142,129]],"whichone":[[224,194,78],[193,224,78]],"wishes":[[199,15,53],[199,54,15]],"withyou":[[60,175,199],[199,143,109]],"youngblood":[[225,28,59],[157,108,236]]};

    var songs = playlists.reduce(function (all, p) {
        p.songs.forEach(function (s) { s.playlist = p.id; s.colors = colors[s.cover] || [[255, 179, 71], [255, 79, 109]]; });
        return all.concat(p.songs);
    }, []);

    window.HELIOS_LIBRARY = { playlists: playlists, songs: songs };
})();
