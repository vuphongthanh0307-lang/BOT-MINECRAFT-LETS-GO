const express = require('express');
const mineflayer = require('mineflayer');

// TẠO WEB SERVER ĐỂ GIỮ APP KHÔNG BỊ RENDER CHO NGỦ
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot của Wind đang múa kiếm 24/7!'));
app.listen(port, () => console.log(`[Web] Server đang chạy trên port ${port}`));

// KHIÊN BẤT TỬ: Chống sập app Render lúc nửa đêm khi gặp lỗi bất ngờ
process.on('uncaughtException', (err) => console.log('[Khiên Bất Tử] Chặn lỗi:', err.message));
process.on('unhandledRejection', (err) => console.log('[Khiên Bất Tử] Lỗi Promise:', err.message));

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let botState = 'HUB'; 
let clickLoop; 
let isLoggingIn = false; 
let antiAfkLoop; 
let isComboRunning = false; // Ổ khóa chống múa đè lệnh

function createBot() {
    const bot = mineflayer.createBot({
        host: 'aemine.vn',
        port: 25565,
        username: 'winlxag5553', 
        version: '1.12.2' 
    });

    // 1. KHI VÀO SẢNH HUB (Lần đầu hoặc khi bị văng ra Hub)
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
            
            if (clickLoop) clearInterval(clickLoop);
            clickLoop = setInterval(() => {
                if (botState === 'HUB') {
                    console.log(`[Hub] Đang click La bàn...`);
                    bot.activateItem(); 
                } else {
                    clearInterval(clickLoop);
                }
            }, 2500); 
        }
    });

    // ====================================================
    // 2. AUTO JOIN PARTY (BẢN HÚT SẠCH MỌI THỂ LOẠI CHỮ & SỐ)
    // ====================================================
    bot.on('messagestr', (message) => {
        // Sự kiện messagestr đã tự động lột sạch mã màu (vàng, xanh, đỏ...)
        if (message.includes('/pt join')) {
            // Tuyệt chiêu \S+ : Bắt lấy chuỗi liền trước khoảng trắng tiếp theo
            const match = message.match(/\/pt join (\S+)/);
            
            if (match) {
                const partyId = match[1]; // Lụm nguyên cái chuỗi phía sau
                console.log(`[Party] Bắt được lời mời! Đang auto gõ: /party join ${partyId}`);
                bot.chat(`/party join ${partyId}`);
            }
        }
    });

    // 3. XỬ LÝ CLICK MENU (Vô cụm Farm)
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
            console.log('[Menu] Thành công! 8 giây nữa bắt đầu quy trình farm...');
            setTimeout(() => startFarmingProcess(bot), 8000);
        } catch (err) {
            console.log('Lỗi click GUI:', err.message);
        }
    });

    // 4. TỰ ĐỘNG HỒI SINH VÀ LẶP LẠI
    bot.on('death', async () => {
        console.log('[Chết] Ôi không, tôi đã hy sinh! Đang hồi sinh...');
        
        // Phá khóa & nhả kẹt phím
        isComboRunning = false; 
        bot.clearControlStates(); 
        
        await sleep(5000); 
        console.log('[Hồi sinh] Bắt đầu lại quy trình farm từ bước /spawn...');
        startFarmingProcess(bot);
    });

    // 5. CHỐNG SẬP & MẤT KẾT NỐI
    bot.on('end', () => {
        console.log('[Mất mạng] Đợi 1 phút tự kết nối lại...');
        botState = 'HUB'; 
        isLoggingIn = false;
        isComboRunning = false;
        if (antiAfkLoop) clearInterval(antiAfkLoop); 
        setTimeout(createBot, 60000); 
    });

    bot.on('error', err => console.log('[Lỗi Minecraft]:', err.message));
}

// 6. KỊCH BẢN FARM (SPAWN -> COMBO -> HOME -> SIT)
async function startFarmingProcess(bot) {
    if (isComboRunning) return; 
    isComboRunning = true;

    try {
        console.log('[Farm] Bước 1: Ra /spawn...');
        bot.chat('/spawn');
        await sleep(5000); 

        console.log('[Farm] Bước 2: Múa combo (Shift + Trái + 3 Phải)...');
        bot.setControlState('sneak', true); 
        await sleep(800); 

        bot.swingArm('right'); // Chuột trái
        await sleep(500);
        bot.activateItem(); // Chuột phải 1
        await sleep(500);
        bot.activateItem(); // Chuột phải 2
        await sleep(500);
        bot.activateItem(); // Chuột phải 3
        await sleep(800);

        bot.clearControlStates(); // Nhả Shift
        await sleep(1500); 

        console.log('[Farm] Bước 3: Về nhà /home...');
        bot.chat('/home');
        await sleep(5000);

        console.log('[Farm] Bước 4: Ngồi xuống /sit...');
        bot.chat('/sit');

        // Bật Anti-AFK để không bị kick
        if (antiAfkLoop) clearInterval(antiAfkLoop);
        antiAfkLoop = setInterval(() => {
            if (botState === 'FARMING' && !isComboRunning) {
                bot.swingArm('right'); 
            }
        }, 240000); 
        
    } catch (err) {
        console.log('[Farm] Lỗi trong lúc múa:', err.message);
    } finally {
        isComboRunning = false; 
    }
}

createBot();
