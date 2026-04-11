const express = require('express');
const mineflayer = require('mineflayer');

// TẠO WEB SERVER (CHỐNG SLEEP)
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot của Wind đang Farm VIP Pro!'));
app.listen(port, () => console.log(`[Web] Server đang chạy trên port ${port}`));

// KHIÊN BẤT TỬ
process.on('uncaughtException', (err) => console.log('[Khiên Bất Tử] Chặn lỗi:', err.message));
process.on('unhandledRejection', (err) => console.log('[Khiên Bất Tử] Lỗi Promise:', err.message));

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// CÁC BIẾN QUẢN LÝ TRẠNG THÁI
let botState = 'HUB'; 
let clickLoop; 
let antiAfkLoop; 
let isLoggingIn = false; 
let isComboRunning = false; 

// BIẾN SINH TỒN
let shouldReconnect = true; // Khóa kết nối nếu bị người chơi khác giết

function createBot() {
    // THÊM viewDistance: 'tiny' ĐỂ ÉP BOT GIẢM CÂN, CỨU RAM CHO THẰNG RENDER
    const bot = mineflayer.createBot({
        host: 'aemine.vn',
        port: 25565,
        username: 'winlxag5553', 
        version: '1.12.2',
        viewDistance: 'tiny' 
    });

    // 1. VÀO SẢNH HUB
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
    // 2. KHUNG CHAT (AUTO PARTY & 1 HIT LÀ OUT VĨNH VIỄN)
    // ====================================================
    bot.on('messagestr', (message) => {
        if (message.includes('/pt join')) {
            const match = message.match(/\/pt join (\S+)/);
            if (match) {
                const partyId = match[1]; 
                console.log(`[Party] Phát hiện lời mời! ID: ${partyId}`);
                bot.chat(`/party join ${partyId}`);
            }
        }

        const isKilledByPlayer = message.includes('winlxag5553') && 
                                 (message.toLowerCase().includes('slain by') || 
                                  message.toLowerCase().includes('slained by') || 
                                  message.toLowerCase().includes('giết'));
        
        if (isKilledByPlayer) {
            console.log('[RÚT LUI KHẨN CẤP] Bị KS! Bãi đã có chủ. Tắt bot ngay!');
            shouldReconnect = false; 
            bot.quit(); 
        }
    });

    // 3. XỬ LÝ CLICK MENU
    bot.on('windowOpen', async (window) => {
        if (botState !== 'HUB') return; 
        if (clickLoop) clearInterval(clickLoop);

        try {
            await sleep(3000); 
            console.log(`[Menu 1] Nhấp slot 20...`);
            await bot.clickWindow(20, 0, 0); 

            await sleep(2500); 
            console.log(`[Menu 2] Nhấp slot 14...`);
            await bot.clickWindow(14, 0, 0); 
            
            botState = 'FARMING'; 
            setTimeout(() => startFarmingProcess(bot), 8000);
        } catch (err) {
            console.log('Lỗi click GUI:', err.message);
        }
    });

    // 4. HỒI SINH TỰ NHIÊN
    bot.on('death', async () => {
        if (!shouldReconnect) return; 
        console.log('[Chết] Bị quái cắn hoặc té chết! Đang hồi sinh...');
        isComboRunning = false; 
        bot.clearControlStates(); 
        await sleep(5000); 
        startFarmingProcess(bot);
    });

    // ====================================================
    // 5. FIX LỖI SERVER RESET & KẸT ACC (KHÔNG NÚP 10 PHÚT NỮA)
    // ====================================================
    bot.on('kicked', (reason) => {
        // Chỉ in ra để biết tại sao bị đá, chứ không tính thời gian 10 phút nữa
        console.log(`[Bị Kick] Server đá ra ngoài! Lý do: ${reason}`);
    });

    bot.on('end', () => {
        // Rút điện nếu bị KS
        if (!shouldReconnect) {
            console.log('[SHUTDOWN] Đã rút điện bot vì bị KS!');
            return;
        }

        botState = 'HUB'; 
        isLoggingIn = false;
        isComboRunning = false;
        if (antiAfkLoop) clearInterval(antiAfkLoop); 
        if (clickLoop) clearInterval(clickLoop);

        // THỜI GIAN VÀNG 2 PHÚT (120000ms) CHỮA BÁCH BỆNH:
        // Đủ để Server reboot lúc 6h / Đủ để Proxy tự xóa kẹt acc
        console.log('[Mất mạng/Reset] Đang đợi 2 phút để server nhả acc rồi vào lại...');
        setTimeout(createBot, 120000); 
    });

    bot.on('error', err => console.log('[Lỗi Minecraft]:', err.message));
}

// 6. KỊCH BẢN FARM (SẴN Ô SỐ 1)
async function startFarmingProcess(bot) {
    if (isComboRunning) return; 
    isComboRunning = true;

    try {
        console.log('[Farm] Đang dọn dẹp Party cũ...');
        bot.chat('/party quit'); 
        await sleep(1500);

        // === BƯỚC MỚI THÊM: THỬ VÀO LẠI PARTY MẶC ĐỊNH ===
        console.log('[Farm] Thử vào lại Party mặc định (18110998125)...');
        bot.chat('/party join 18110998125');
        await randomSleep(1500, 2000); // Ngâm một nhịp cho server xử lý
        
        console.log('[Farm] Chuẩn bị đồ nghề: Chọn ô số 1 trên tay...');
        bot.setQuickBarSlot(0); 
        await sleep(1000);

        console.log('[Farm] Ra /spawn...');
        bot.chat('/spawn');
        await sleep(5000); 

        console.log('[Farm] Bắt đầu chuỗi Combo...');
        bot.setControlState('sneak', true); 
        await sleep(800); 
        bot.swingArm('right'); 
        await sleep(500);
        bot.activateItem(); 
        await sleep(500);
        bot.activateItem(); 
        await sleep(500);
        bot.activateItem(); 
        await sleep(800);

        bot.clearControlStates(); 
        await sleep(1500); 

        console.log('[Farm] Về nhà /home...');
        bot.chat('/home');
        await sleep(5000);
        
        console.log('[Farm] Ngồi xuống /sit...');
        bot.chat('/sit');

        if (antiAfkLoop) clearInterval(antiAfkLoop);
        antiAfkLoop = setInterval(() => {
            if (botState === 'FARMING' && !isComboRunning) {
                bot.swingArm('right'); 
            }
        }, 240000); 
        
    } catch (err) {
        console.log('[Farm] Lỗi:', err.message);
    } finally {
        isComboRunning = false; 
    }
}

createBot();
