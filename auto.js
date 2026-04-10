const express = require('express');
const mineflayer = require('mineflayer');

// TẠO WEB SERVER
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(port, () => console.log(`[Web] Port ${port}`));

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let botState = 'HUB'; 
let compassInterval = null; 

function createBot() {
    const bot = mineflayer.createBot({
        host: 'aemine.vn',
        port: 25565,
        username: 'winlxag5553', 
        version: '1.12.2' 
    });

    bot.on('spawn', async () => {
        if (botState === 'HUB') {
            console.log('[Hub] Đã vào sảnh, chuẩn bị đăng nhập...');
            await sleep(2000);
            
            // ĐIỀN MẬT KHẨU CỦA BRO VÀO ĐÂY
            bot.chat('/l Windvu2193'); 
            await sleep(6000); 

            // FIX CỰC MẠNH: Tự động tìm La bàn trong người để cầm lên
            const compass = bot.inventory.items().find(item => item.name === 'compass');
            if (compass) {
                console.log('[Hub] Đã tìm thấy La bàn, móc ra ngay...');
                await bot.equip(compass, 'hand');
            } else {
                console.log('[Hub] Á đù không thấy La bàn, cứ nhấp bừa ô 4 vậy!');
                bot.setQuickBarSlot(4);
            }
            
            await sleep(1000);
            
            let clickAttempts = 0;
            if (compassInterval) clearInterval(compassInterval);

            compassInterval = setInterval(() => {
                if (botState === 'HUB' && !bot.currentWindow && clickAttempts < 15) {
                    console.log(`[Hub] Click chuột phải lần ${clickAttempts + 1}...`);
                    bot.activateItem(); 
                    clickAttempts++;
                }
            }, 2500); 
        }
    });

    // BẢN CHƠI HỆ TỌA ĐỘ CỦA BRO (19 VÀ 15)
    bot.on('windowOpen', async (window) => {
        if (botState !== 'HUB') return; 
        
        if (compassInterval) clearInterval(compassInterval);
        console.log(`[Menu] BẢNG ĐÃ MỞ! Bắt đầu nhấp theo tọa độ bro dặn...`);

        try {
            await sleep(1000); 

            const slot15 = window.slots[15];
            const slot19 = window.slots[19];

            // Kiểm tra Menu 2: Kiếm Vàng ở slot 15
            if (slot15 && slot15.name && slot15.name.includes('sword')) {
                console.log('[Menu 2] Thấy Kiếm Vàng ở slot 15. Lao vào Farm!');
                await bot.clickWindow(15, 0, 0);
                
                botState = 'FARMING'; 
                setTimeout(() => startFarmingProcess(bot), 8000);
                return; 
            }

            // Kiểm tra Menu 1: Block Cỏ ở slot 19
            if (slot19 && slot19.name && slot19.name.includes('grass')) {
                console.log('[Menu 1] Thấy Cỏ ở slot 19. Nhấp mở Menu 2...');
                await bot.clickWindow(19, 0, 0); 
                return; 
            }

            console.log('[Menu] Ảo ma: Chả thấy Cỏ ở 19 cũng chả thấy Kiếm ở 15!');

        } catch (err) {
            console.log('Lỗi click GUI:', err);
        }
    });

    bot.on('messagestr', (message) => {
        if (message.includes('/pt join 18110998125')) {
            console.log('[Party] Có lời mời, đang vào...');
            bot.chat('/party join 18110998125');
        }
    });

    bot.on('death', async () => {
        console.log('[Chết] Đang hồi sinh...');
        await sleep(3000); 
        startFarmingProcess(bot);
    });

    bot.on('end', () => {
        console.log('[Mất mạng] Đợi 1 phút rồi tự kết nối lại...');
        botState = 'HUB'; 
        setTimeout(createBot, 60000); 
    });

    bot.on('error', err => console.log('Lỗi:', err));
}

// LOGIC FARM CHÍNH THỨC
async function startFarmingProcess(bot) {
    bot.chat('/party quit'); 
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
