const express = require('express');
const mineflayer = require('mineflayer');

// TẠO WEB SERVER
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Bot của Wind đang múa kiếm rách màn hình nhé!');
});
app.listen(port, () => {
    console.log(`[Web] Server đang chạy trên port ${port}`);
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let botState = 'HUB'; 

let clickLoop; // Biến toàn cục để tắt vòng lặp
let isLoggingIn = false; // Chống phân thân

function createBot() {
    const bot = mineflayer.createBot({
        host: 'aemine.vn',
        port: 25565,
        username: 'winlxag5553', 
        version: '1.12.2' 
    });

    // 1. KHI VÀO SẢNH HUB
    bot.on('spawn', async () => {
        if (botState === 'HUB' && !isLoggingIn) {
            isLoggingIn = true;
            console.log('[Hub] Đã vào sảnh, chuẩn bị đăng nhập...');
            await sleep(2000);
            
            // ĐIỀN MẬT KHẨU CỦA BRO VÀO ĐÂY
            bot.chat('/l Windvu2193'); 
            
            await sleep(6000); 

            console.log('[Hub] Cầm La bàn lên tay...');
            bot.setQuickBarSlot(4); 
            await sleep(1000);
            
            let clickAttempts = 0;
            if (clickLoop) clearInterval(clickLoop);

            // ĐÃ FIX BỎ CHỮ 'const': Để nó dùng chung chìa khóa tắt ở trên
            clickLoop = setInterval(() => {
                if (botState === 'HUB' && clickAttempts < 10) {
                    console.log(`[Hub] Đang click La bàn lần ${clickAttempts + 1}...`);
                    bot.activateItem(); 
                    clickAttempts++;
                } else {
                    clearInterval(clickLoop);
                }
            }, 2000); 
        }
    });

    // 2. AUTO JOIN PARTY
    bot.on('messagestr', (message) => {
        if (message.includes('/pt join 18110998125')) {
            console.log('[Party] Có lời mời, đang vào nhóm...');
            bot.chat('/party join 18110998125');
        }
    });

    // 3. XỬ LÝ MENU CLICK SERVER (BẢN NHẮM MẮT CLICK CHẬM)
    bot.on('windowOpen', async (window) => {
        if (botState !== 'HUB') return; 
        
        // Rút điện la bàn ngay lập tức (Lần này là tắt thật 100%)
        if (clickLoop) clearInterval(clickLoop);

        console.log(`[Menu] Bảng đã mở... Đang chờ server load 3 giây...`);

        try {
            await sleep(3000); 

            console.log(`[Menu 1] Nhấp thẳng vào slot 20 (Cỏ)...`);
            await bot.clickWindow(20, 0, 0); 

            console.log(`[Menu] Đang chờ 2.5 giây để mở bảng 2...`);
            await sleep(2500); 

            console.log(`[Menu 2] Nhấp thẳng vào slot 14 (Kiếm Vàng)...`);
            await bot.clickWindow(14, 0, 0); 
            
            botState = 'FARMING'; 
            console.log('[Menu] Đã xong chuỗi click! 8 giây nữa bắt đầu farm...');
            setTimeout(() => startFarmingProcess(bot), 8000);

        } catch (err) {
            console.log('Lỗi click GUI:', err);
        }
    });

    // 4. HỒI SINH
    bot.on('death', async () => {
        console.log('[Chết] Đang hồi sinh...');
        await sleep(3000); 
        startFarmingProcess(bot);
    });

    // 5. CHỐNG SẬP SERVER
    bot.on('end', () => {
        console.log('[Mất mạng] Đợi 1 phút rồi tự kết nối lại...');
        botState = 'HUB'; 
        isLoggingIn = false;
        setTimeout(createBot, 60000); 
    });

    bot.on('error', err => console.log('Lỗi:', err));
}

// 6. LOGIC FARM CHÍNH THỨC (BẢN FIX CHUẨN NHỊP ĐIỆU)
async function startFarmingProcess(bot) {
    console.log('[Farm] Đang dọn dẹp Party cũ...');
    bot.chat('/party quit'); 
    await sleep(2000); // Tăng lên 2s cho chắc ăn

    console.log('[Farm] Dịch chuyển về nhà...');
    bot.chat('/home');
    await sleep(5000); // Tăng lên 5s để đảm bảo mạng load xong map ở nhà

    console.log('[Farm] Bắt đầu chuỗi Combo: Đè Shift...');
    bot.setControlState('sneak', true); 
    await sleep(800); // Đợi 1 nhịp cho server nhận diện là đang đè Shift

    console.log('[Farm] Múa: Chuột TRÁI (1 lần)');
    bot.swingArm('right'); // Trong Minecraft, swingArm('right') chính là click chuột trái
    await sleep(500);
    
    console.log('[Farm] Múa: Chuột PHẢI (Lần 1)');
    bot.activateItem(); 
    await sleep(500);
    
    console.log('[Farm] Múa: Chuột PHẢI (Lần 2)');
    bot.activateItem(); 
    await sleep(500);
    
    console.log('[Farm] Múa: Chuột PHẢI (Lần 3)');
    bot.activateItem(); 
    await sleep(800);

    console.log('[Farm] Xong combo, Nhả Shift ra...');
    bot.setControlState('sneak', false); 
    await sleep(1500); // Đứng đợi 1.5s trước khi ngồi cho mượt

    console.log('[Farm] An tọa bằng /sit...');
    bot.chat('/sit');
}

createBot();
