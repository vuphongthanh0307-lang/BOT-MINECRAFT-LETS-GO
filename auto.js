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

// CHÌA KHÓA CHỐNG BUG: Khóa luồng và khóa la bàn
let clickLoop; 
let isLoggingIn = false; 

function createBot() {
    const bot = mineflayer.createBot({
        host: 'aemine.vn',
        port: 25565,
        username: 'winlxag5553', 
        version: '1.12.2' 
    });

    // 1. KHI VÀO SẢNH HUB
    bot.on('spawn', async () => {
        // Ổ KHÓA CHỐNG PHÂN THÂN: Chỉ cho chạy đúng 1 lần duy nhất!
        if (botState === 'HUB' && !isLoggingIn) {
            isLoggingIn = true; // Khóa cửa lại

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

    // 3. XỬ LÝ MENU CLICK SERVER (BẢN KIÊN NHẪN 5 GIÂY)
    bot.on('windowOpen', async (window) => {
        if (botState !== 'HUB') return; 
        
        // Rút điện la bàn
        if (clickLoop) clearInterval(clickLoop);

        console.log(`[Menu] Bảng đã mở...`);
        console.log(`[Menu] Đang chill 5 giây chờ server nhả đồ...`);

        try {
            await sleep(5000); // CHỜ HẲN 5 GIÂY CHO ĐÁNG ĐỒNG TIỀN BÁT GẠO

            // In lại X-quang để lát check xem 5s có đủ không
            console.log("--- X-QUANG ĐỒ LẦN NÀY ---");
            window.items().forEach(item => {
                console.log(`> Slot ${item.slot}: ${item.name} `);
            });
            console.log("--------------------------");

            const itemSlot13 = window.slots[13]; 
            const itemSlot15 = window.slots[15]; 
            const itemSlot19 = window.slots[19]; 

            // Ưu tiên 1: Cụm Farm (Menu 2)
            if (itemSlot13 && itemSlot13.name && itemSlot13.name.includes('sword')) {
                console.log('[Menu 2] Thấy Kiếm Vàng ô 13! Lụm...');
                await bot.clickWindow(13, 0, 0); 
                botState = 'FARMING'; 
                setTimeout(() => startFarmingProcess(bot), 8000);
                return;
            } else if (itemSlot15 && itemSlot15.name && itemSlot15.name.includes('sword')) {
                console.log('[Menu 2] Thấy Kiếm Vàng ô 15! Lụm...');
                await bot.clickWindow(15, 0, 0); 
                botState = 'FARMING'; 
                setTimeout(() => startFarmingProcess(bot), 8000);
                return;
            }

            // Ưu tiên 2: Block Cỏ (Menu 1)
            if (itemSlot19 && itemSlot19.name && itemSlot19.name.includes('grass')) {
                console.log(`[Menu 1] Đã thấy Cỏ ở ô 19! Đang click mở Menu 2...`);
                await bot.clickWindow(19, 0, 0); 
                return;
            }

            console.log('[Menu] 5 giây rồi mà bảng vẫn trống! Bó tay server!');

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
        isLoggingIn = false; // Mở khóa cho lần kết nối sau
        setTimeout(createBot, 60000); 
    });

    bot.on('error', err => console.log('Lỗi:', err));
}

// 6. LOGIC FARM CHÍNH THỨC
async function startFarmingProcess(bot) {
    console.log('[Farm] Đang dọn dẹp Party cũ...');
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
