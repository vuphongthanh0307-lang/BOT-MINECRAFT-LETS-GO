const express = require('express');
const mineflayer = require('mineflayer');

// TẠO WEB SERVER
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot của Wind đang múa kiếm 24/7!'));
app.listen(port, () => console.log(`[Web] Server đang chạy trên port ${port}`));

// KHIÊN BẤT TỬ: Chống sập app Render lúc nửa đêm
process.on('uncaughtException', (err) => console.log('[Khiên Bất Tử] Chặn lỗi:', err.message));
process.on('unhandledRejection', (err) => console.log('[Khiên Bất Tử] Lỗi Promise:', err.message));

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let botState = 'HUB'; 

let clickLoop; 
let isLoggingIn = false; 
let antiAfkLoop; 

// === Ổ KHÓA CHỐNG PHÂN THÂN ===
let isComboRunning = false; 

function createBot() {
    const bot = mineflayer.createBot({
        host: 'aemine.vn',
        port: 25565,
        username: 'winlxag5553', 
        version: '1.12.2' 
    });

    bot.on('spawn', async () => {
        if (botState === 'HUB' && !isLoggingIn) {
            isLoggingIn = true;
            console.log('[Hub] Đã vào sảnh, chuẩn bị đăng nhập...');
            await sleep(2000);
            
            bot.chat('/l Windvu2193'); 
            await sleep(6000); 

            console.log('[Hub] Cầm La bàn lên tay...');
            bot.setQuickBarSlot(4); 
            await sleep(1000);
            
            let clickAttempts = 0;
            if (clickLoop) clearInterval(clickLoop);

            clickLoop = setInterval(() => {
                if (botState === 'HUB' && clickAttempts < 10) {
                    console.log(`[Hub] Click La bàn lần ${clickAttempts + 1}...`);
                    bot.activateItem(); 
                    clickAttempts++;
                } else {
                    clearInterval(clickLoop);
                }
            }, 2000); 
        }
    });

    bot.on('messagestr', (message) => {
        if (message.includes('/pt join 18110998125')) {
            console.log('[Party] Đang vào nhóm...');
            bot.chat('/party join 18110998125');
        }
    });

    bot.on('windowOpen', async (window) => {
        if (botState !== 'HUB') return; 
        if (clickLoop) clearInterval(clickLoop);

        try {
            await sleep(3000); 
            console.log(`[Menu 1] Nhấp slot 20 (Cỏ)...`);
            await bot.clickWindow(20, 0, 0); 

            await sleep(2500); 
            console.log(`[Menu 2] Nhấp slot 14 (Kiếm Vàng)...`);
            await bot.clickWindow(14, 0, 0); 
            
            botState = 'FARMING'; 
            console.log('[Menu] Xong chuỗi click! 8 giây nữa farm...');
            setTimeout(() => startFarmingProcess(bot), 8000);

        } catch (err) {
            console.log('Lỗi click GUI:', err.message);
        }
    });

    bot.on('death', async () => {
        console.log('[Chết] Đang hồi sinh...');
        await sleep(3000); 
        startFarmingProcess(bot);
    });

    bot.on('end', () => {
        console.log('[Mất mạng] Bị văng! Đợi 1 phút tự kết nối lại...');
        botState = 'HUB'; 
        isLoggingIn = false;
        if (antiAfkLoop) clearInterval(antiAfkLoop); 
        setTimeout(createBot, 60000); 
    });

    bot.on('error', err => console.log('[Lỗi Minecraft]:', err.message));
}

// 6. LOGIC FARM (FIX KẸT PHÍM & CHỐNG LẶP COMBO)
async function startFarmingProcess(bot) {
    // Nếu ổ khóa đang đóng (tức là đang múa) thì KHÔNG CHO múa đè lên
    if (isComboRunning) {
        console.log('[Farm] Đang múa rồi, chặn lệnh gọi đè!');
        return;
    }
    
    isComboRunning = true; // Bắt đầu múa -> Đóng khóa

    try {
        console.log('[Farm] Dịch chuyển ra /spawn...');
        bot.chat('/spawn');
        await sleep(5000); 

        console.log('[Farm] Đè Shift...');
        bot.setControlState('sneak', true); 
        await sleep(800); 

        console.log('[Farm] Múa: Chuột TRÁI');
        bot.swingArm('right'); 
        await sleep(500);
        
        console.log('[Farm] Múa: Chuột PHẢI (1)');
        bot.activateItem(); 
        await sleep(500);
        
        console.log('[Farm] Múa: Chuột PHẢI (2)');
        bot.activateItem(); 
        await sleep(500);
        
        console.log('[Farm] Múa: Chuột PHẢI (3)');
        bot.activateItem(); 
        await sleep(800);

        console.log('[Farm] Xong combo, xóa sạch mọi thao tác kẹt (Nhả Shift)...');
        bot.clearControlStates(); // LỆNH TỐI THƯỢNG TRỊ KẸT PHÍM
        await sleep(1500); 

        console.log('[Farm] Dịch chuyển về /home...');
        bot.chat('/home');
        await sleep(5000);

        console.log('[Farm] An tọa bằng /sit...');
        bot.chat('/sit');

        // === ANTI-AFK ===
        if (antiAfkLoop) clearInterval(antiAfkLoop);
        antiAfkLoop = setInterval(() => {
            if (botState === 'FARMING') {
                console.log('[Anti-AFK] Vung tay chống kick...');
                bot.swingArm('right'); 
            }
        }, 240000); 
        
    } catch (err) {
        console.log('[Farm] Lỗi:', err.message);
    } finally {
        // Chạy xong hết toàn bộ thì MỞ KHÓA ra cho lần hồi sinh sau (nếu có)
        isComboRunning = false; 
    }
}

createBot();
