const express = require('express');
const mineflayer = require('mineflayer');

// TẠO WEB SERVER ĐỂ LÁCH LUẬT TREO 24/7
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Bot của Wind vẫn đang online và sẵn sàng Party nhé!');
});
app.listen(port, () => {
    console.log(`[Web] Server đang chạy trên port ${port}`);
});

// LOGIC BOT MINEFLAYER
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let botState = 'HUB'; 

function createBot() {
    const bot = mineflayer.createBot({
        host: 'aemine.vn',
        port: 25565,
        username: 'Windvu2193', 
        version: '1.12.2' 
    });

    // 1. KHI VÀO SERVER (HOẶC VÀO LẠI)
    bot.on('spawn', async () => {
        console.log('[Hệ thống] Bot đã spawn!');
        
        // Luôn thoát party cũ mỗi khi vào lại server
        bot.chat('/party quit');
        await sleep(1000);

        if (botState === 'HUB') {
            await sleep(1000);
            bot.chat('/l MẬT_KHẨU_CỦA_BRO'); // Sửa pass ở đây
            await sleep(3000); 
            bot.setQuickBarSlot(4); 
            await sleep(1000);
            bot.activateItem(); 
        }
    });

    // 2. TỰ ĐỘNG JOIN PARTY KHI THẤY TIN NHẮN MÀU VÀNG
    bot.on('messagestr', (message) => {
        // Kiểm tra nếu dòng chat chứa nội dung bro yêu cầu
        if (message.includes('/pt join 18110998125')) {
            console.log('[Party] Phát hiện lời mời, đang tham gia...');
            bot.chat('/party join 18110998125');
        }
    });

    // 3. XỬ LÝ CLICK GUI CHỌN SERVER
    bot.on('windowOpen', async (window) => {
        if (botState !== 'HUB') return; 
        try {
            const grassItem = window.items().find(item => item.name === 'grass');
            if (grassItem && window.title.includes('Aemine.vn')) {
                await bot.clickWindow(grassItem.slot, 0, 0);
                return;
            }
            const goldenSword = window.items().find(item => item.name === 'golden_sword');
            if (goldenSword) {
                await bot.clickWindow(goldenSword.slot, 0, 0);
                botState = 'FARMING';
                setTimeout(() => startFarmingProcess(bot), 8000);
            }
        } catch (err) {
            console.log('Lỗi GUI:', err);
        }
    });

    // 4. HỒI SINH KHI CHẾT
    bot.on('death', async () => {
        console.log('[Chết] Đang hồi sinh và farm lại...');
        await sleep(3000); 
        startFarmingProcess(bot);
    });

    // 5. TỰ VÀO LẠI KHI DISCONNECT
    bot.on('end', () => {
        console.log('[Mất mạng] Đang đợi vào lại...');
        botState = 'HUB'; 
        setTimeout(createBot, 60000); 
    });

    bot.on('error', err => console.log('Lỗi:', err));
}

// 6. LOGIC FARM: HOME -> SHIFT COMBO -> SIT
async function startFarmingProcess(bot) {
    console.log('[Farm] Đang về nhà...');
    bot.chat('/home');
    await sleep(3000); 

    console.log('[Farm] Đè Shift và múa combo...');
    bot.setControlState('sneak', true); // Đè Shift
    await sleep(500);

    bot.swingArm('right'); // Chuột trái
    await sleep(300);
    bot.activateItem(); // Chuột phải 1
    await sleep(300);
    bot.activateItem(); // Chuột phải 2
    await sleep(300);
    bot.activateItem(); // Chuột phải 3
    await sleep(500);

    bot.setControlState('sneak', false); // Nhả Shift
    await sleep(500);

    console.log('[Farm] Chốt hạ bằng /sit...');
    bot.chat('/sit');
}

createBot();
