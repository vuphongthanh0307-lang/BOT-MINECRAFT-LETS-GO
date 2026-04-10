const express = require('express');
const mineflayer = require('mineflayer');

// TẠO WEB SERVER
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(port, () => console.log(`[Web] Port ${port}`));

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let botState = 'HUB'; 
let compassInterval = null; // Khai báo chìa khóa để ngắt vòng lặp

function createBot() {
    const bot = mineflayer.createBot({
        host: 'aemine.vn',
        port: 25565,
        username: 'Windvu2193', 
        version: '1.12.2' 
    });

    bot.on('spawn', async () => {
        if (botState === 'HUB') {
            console.log('[Hub] Đã vào sảnh, chuẩn bị đăng nhập...');
            await sleep(2000);
            
            // ĐIỀN MẬT KHẨU CỦA BRO VÀO ĐÂY
            bot.chat('/l MẬT_KHẨU_CỦA_BRO'); 
            await sleep(6000); 

            bot.setQuickBarSlot(4); 
            await sleep(1000);
            
            let clickAttempts = 0;
            if (compassInterval) clearInterval(compassInterval); // Dọn dẹp lặp cũ

            // Vòng lặp nhấp la bàn
            compassInterval = setInterval(() => {
                // Thêm điều kiện: CHỈ click khi KHÔNG CÓ menu nào đang mở
                if (botState === 'HUB' && !bot.currentWindow && clickAttempts < 15) {
                    console.log(`[Hub] Click La bàn lần ${clickAttempts + 1}...`);
                    bot.activateItem(); 
                    clickAttempts++;
                }
            }, 2500); // Tăng lên 2.5s cho server kịp thở
        }
    });

    bot.on('windowOpen', async (window) => {
        if (botState !== 'HUB') return; 
        
        // RÚT ĐIỆN NGAY LẬP TỨC: Tắt trò spam click la bàn
        if (compassInterval) clearInterval(compassInterval);

        console.log(`[Menu] Bảng đã mở, đang đợi server load đồ...`);

        try {
            // Đợi hẳn 1 giây cho Aemine hết lag
            await sleep(1000); 

            // ƯU TIÊN 1: TÌM MINELORD (Menu 2)
            const mineLordItem = window.items().find(item => {
                const itemDataString = JSON.stringify(item); 
                return itemDataString.includes('MineLord') && !itemDataString.includes('MineLord II');
            });

            if (mineLordItem) {
                console.log(`[Menu 2] TUYỆT VỜI! Bắt được MineLord ở slot ${mineLordItem.slot}. Vào Farm!`);
                await bot.clickWindow(mineLordItem.slot, 0, 0);
                
                botState = 'FARMING'; 
                setTimeout(() => startFarmingProcess(bot), 8000);
                return; 
            }

            // ƯU TIÊN 2: TÌM CỎ SLOT 20 (Menu 1)
            const itemSlot20 = window.slots[20];
            if (itemSlot20 && JSON.stringify(itemSlot20).includes('grass')) {
                console.log('[Menu 1] Đã thấy Cỏ slot 20. Bấm tiếp...');
                await bot.clickWindow(20, 0, 0); 
                return; 
            }

            console.log('[Menu] Ảo thật, bảng trống trơn! Mạng lag làm rớt đồ rồi.');

        } catch (err) {
            console.log('Lỗi click GUI:', err);
        }
    });

    // CÁC TÍNH NĂNG KHÁC GIỮ NGUYÊN
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
