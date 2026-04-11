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

// BIẾN SINH TỒN & ÂN XÁ
let playerDeathCount = 0; 
let shouldReconnect = true; 
let wasKicked = false; 
let killResetTimer = null; // Biến giữ đồng hồ ân xá

function createBot() {
    const bot = mineflayer.createBot({
        host: 'aemine.vn',
        port: 25565,
        username: 'winlxag5553', 
        version: '1.12.2' 
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
    // 2. KHUNG CHAT (SOI MÃ PARTY & ÂN XÁ 15 PHÚT)
    // ====================================================
    bot.on('messagestr', (message) => {
        // A. AUTO PARTY
        if (message.includes('/pt join')) {
            const match = message.match(/\/pt join (\S+)/);
            if (match) {
                const partyId = match[1]; 
                console.log(`[Party] Phát hiện lời mời! ID: ${partyId}`);
                bot.chat(`/party join ${partyId}`);
            }
        }

        // B. CẢNH BÁO BỊ KS & CƠ CHẾ ÂN XÁ
        const isKilledByPlayer = message.includes('winlxag5553') && 
                                 (message.toLowerCase().includes('slain by') || 
                                  message.toLowerCase().includes('slained by') || 
                                  message.toLowerCase().includes('giết'));
        
        if (isKilledByPlayer) {
            playerDeathCount++;
            console.log(`[CẢNH BÁO MÁU] Bị giết lần thứ ${playerDeathCount}`);
            
            if (playerDeathCount >= 2) {
                console.log('[RÚT LUI] Bị KS 2 lần liên tục! Nghỉ game.');
                shouldReconnect = false; 
                bot.quit();
            } else {
                // NẾU CHỈ MỚI BỊ GIẾT 1 LẦN: Kích hoạt đồng hồ ân xá 15 phút
                console.log('[Hệ Thống] Đã kích hoạt đồng hồ ân xá. Nếu trong 15 phút tới không bị giết nữa, số mạng sẽ reset về 0.');
                
                if (killResetTimer) clearTimeout(killResetTimer); // Xóa đồng hồ cũ nếu có
                
                killResetTimer = setTimeout(() => {
                    playerDeathCount = 0;
                    console.log('[Hệ Thống] Đã qua 15 phút bình yên. Reset số lần bị giết về 0!');
                }, 900000); // 15 phút = 15 * 60 * 1000 ms
            }
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

    // 4. HỒI SINH
    bot.on('death', async () => {
        if (!shouldReconnect) return; 
        console.log('[Chết] Đang hồi sinh...');
        isComboRunning = false; 
        bot.clearControlStates(); 
        await sleep(5000); 
        startFarmingProcess(bot);
    });

    // 5. BỊ STAFF SÚT & MẤT KẾT NỐI
    bot.on('kicked', (reason) => {
        console.log(`[CẢNH BÁO ĐỎ] Bị STAFF sút! Lý do: ${reason}`);
        wasKicked = true; 
    });

    bot.on('end', () => {
        if (!shouldReconnect) return;

        botState = 'HUB'; 
        isLoggingIn = false;
        isComboRunning = false;
        if (antiAfkLoop) clearInterval(antiAfkLoop); 

        let waitTime = 60000; 
        if (wasKicked) {
            console.log('[TRÚ ẨN] Bị soi, núp 10 phút...');
            waitTime = 600000; 
            wasKicked = false; 
        }

        setTimeout(createBot, waitTime); 
    });

    bot.on('error', err => console.log('[Lỗi Minecraft]:', err.message));
}

// 6. KỊCH BẢN FARM
async function startFarmingProcess(bot) {
    if (isComboRunning) return; 
    isComboRunning = true;

    try {
        console.log('[Farm] Ra /spawn...');
        bot.chat('/spawn');
        await sleep(5000); 

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

        bot.chat('/home');
        await sleep(5000);
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
