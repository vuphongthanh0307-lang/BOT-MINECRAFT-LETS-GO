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

function createBot() {
    const bot = mineflayer.createBot({
        host: 'aemine.vn',
        port: 25565,
        username: 'winlxag5553', 
        version: '1.12.2' 
    });

    // 1. KHI VÀO SẢNH HUB
    bot.on('spawn', async () => {
        if (botState === 'HUB') {
            console.log('[Hub] Đã vào sảnh, chuẩn bị đăng nhập...');
            await sleep(2000);
            
            // ĐIỀN MẬT KHẨU CỦA BRO VÀO ĐÂY
            bot.chat('/l Windvu2193'); 
            
            // Tăng thời gian chờ load inventory lên 6 giây
            await sleep(6000); 

            console.log('[Hub] Cầm La bàn lên tay...');
            bot.setQuickBarSlot(4); 
            await sleep(1000);
            
            // VÒNG LẶP SPAM CLICK: Click liên tục đến khi menu mở
            let clickAttempts = 0;
            const clickLoop = setInterval(() => {
                if (botState === 'HUB' && clickAttempts < 10) {
                    console.log(`[Hub] Đang click La bàn lần ${clickAttempts + 1}...`);
                    bot.activateItem(); 
                    clickAttempts++;
                } else {
                    clearInterval(clickLoop);
                }
            }, 2000); // Cứ 2 giây click 1 lần
        }
    });

    // 2. AUTO JOIN PARTY
    bot.on('messagestr', (message) => {
        if (message.includes('/pt join 18110998125')) {
            console.log('[Party] Có lời mời, đang vào nhóm...');
            bot.chat('/party join 18110998125');
        }
    });

    // 3. XỬ LÝ MENU CLICK SERVER
    bot.on('windowOpen', async (window) => {
        if (botState !== 'HUB') return; 
        
        console.log(`[Menu] Đã mở bảng: ${window.title}`);

        try {
            await sleep(500); 

            // BƯỚC 1: Check Menu 2 (Cụm server) - Nhắm ô số 4 (Kiếm Vàng)
            const itemSlot4 = window.slots[4];
            if (itemSlot4 && itemSlot4.name.includes('sword')) {
                console.log('[Menu 2] Trúng phóc Kiếm Vàng! Đang phi vào cụm MineLord...');
                await bot.clickWindow(4, 0, 0);
                
                botState = 'FARMING'; 
                setTimeout(() => startFarmingProcess(bot), 8000);
                return;
            }

            // BƯỚC 2: Check Menu 1 (Menu tổng) - Nhắm ô số 20 (Block Cỏ)
            const itemSlot20 = window.slots[20]; // SỬA LẠI SỐ 20 Ở ĐÂY
            if (itemSlot20) {
                console.log(`[Menu 1] Đã thấy ô Cỏ ở vị trí 20, đang click...`);
                await bot.clickWindow(20, 0, 0); // VÀ CẢ Ở ĐÂY NỮA
                return;
            }

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
        setTimeout(createBot, 60000); 
    });

    bot.on('error', err => console.log('Lỗi:', err));
}

// 6. LOGIC FARM CHÍNH THỨC
async function startFarmingProcess(bot) {
    console.log('[Farm] Đang dọn dẹp Party cũ...');
    bot.chat('/party quit'); // Dời lệnh này xuống đây cho an toàn
    await sleep(1500);

    console.log('[Farm] Dịch chuyển về nhà...');
    bot.chat('/home');
    await sleep(3000); 

    console.log('[Farm] Đè Shift và múa combo...');
    bot.setControlState('sneak', true); 
    await sleep(500);

    bot.swingArm('right'); 
    await sleep(300);
    bot.activateItem(); 
    await sleep(300);
    bot.activateItem(); 
    await sleep(300);
    bot.activateItem(); 
    await sleep(500);

    bot.setControlState('sneak', false); 
    await sleep(500);

    console.log('[Farm] An tọa bằng /sit...');
    bot.chat('/sit');
}

createBot();
