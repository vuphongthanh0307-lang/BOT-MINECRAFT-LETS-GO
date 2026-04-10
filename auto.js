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

    // 3. XỬ LÝ MENU CLICK SERVER (TỌA ĐỘ CHUẨN 13 VÀ 19 CỦA BRO)
    bot.on('windowOpen', async (window) => {
        if (botState !== 'HUB') return; 
        
        // RÚT ĐIỆN VÒNG LẶP LA BÀN NGAY LẬP TỨC
        if (clickLoop) clearInterval(clickLoop);

        console.log(`[Menu] Đã mở bảng: ${window.title}`);

        try {
            await sleep(800); // Đợi xíu cho mạng load đồ

            const itemSlot13 = window.slots[13]; // Kiếm vàng cụm 1
            const itemSlot15 = window.slots[15]; // Kiếm vàng cụm 2 (phòng hờ)
            const itemSlot19 = window.slots[19]; // Cỏ

            // BƯỚC 1: Check Menu 2 (Game Menu) - Nhắm Slot 13 hoặc 15
            if (itemSlot13 && itemSlot13.name && itemSlot13.name.includes('sword')) {
                console.log('[Menu 2] Trúng phóc Kiếm Vàng ô 13! Vào cụm Farm...');
                await bot.clickWindow(13, 0, 0); 
                botState = 'FARMING'; 
                setTimeout(() => startFarmingProcess(bot), 8000);
                return;
            } else if (itemSlot15 && itemSlot15.name && itemSlot15.name.includes('sword')) {
                console.log('[Menu 2] Trúng phóc Kiếm Vàng ô 15! Vào cụm Farm...');
                await bot.clickWindow(15, 0, 0); 
                botState = 'FARMING'; 
                setTimeout(() => startFarmingProcess(bot), 8000);
                return;
            }

            // BƯỚC 2: Check Menu 1 (Menu tổng) - Nhắm Slot 19 (Block Cỏ)
            if (itemSlot19 && itemSlot19.name && itemSlot19.name.includes('grass')) {
                console.log(`[Menu 1] Đã thấy Cỏ ở ô 19, đang click chuyển bảng...`);
                await bot.clickWindow(19, 0, 0); 
                return;
            }

            console.log('[Menu] Lỗi: Bảng trống hoặc sai tọa độ (Không thấy Cỏ/Kiếm)!');

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
