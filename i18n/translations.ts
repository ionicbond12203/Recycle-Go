export type Language = 'en' | 'zh' | 'ms';

export const translations = {
    en: {
        home: {
            welcome: "Welcome",
            points: "POINTS",
            savedCO2: "SAVED CO2",
            recycled: "RECYCLED",
            recentActivity: "Recent Activity",
            dailyTip: "Daily Eco-Tip",
            noActivity: "No recent recycling activity",
            kgRecycled: "kg Recycled",
            viewDetails: "View Details",
            itemsRecycled: "Items Recycled",
            close: "Close",
            goodMorning: "Good morning,",
            environmentalImpact: "ENVIRONMENTAL IMPACT",
            thisMonth: "This Month",
            recycleNow: "Recycle Now",
            viewAll: "View All",
            noProcessingActivity: "No recent processing activity."
        },
        profile: {
            title: "My Profile",
            level: {
                novice: "Eco Novice",
                warrior: "Eco Warrior",
                master: "Earth Guardian",
                legend: "Sustainability Legend"
            },
            nextLevel: "{points} pts to next level",
            settings: "Settings",
            darkMode: "Dark Mode",
            language: "Language",
            support: "Help & Support",
            logout: "Log Out",
            viewHistory: "Transaction History",
            developer: "Developer",
            github: "GitHub",
            email: "Email"
        },
        tips: {
            didYouKnow: "Did You Know?",
            tip1: "Recycling one aluminum can saves enough energy to run a TV for 3 hours!",
            tip2: "Glass is 100% recyclable and can be recycled endlessly without loss in quality.",
            tip3: "Rinsing your recyclables prevents contamination and ensures they get recycled.",
        },
        materials: {
            plastic: "Plastic",
            glass: "Glass",
            aluminium: "Aluminium",
            paper: "Paper"
        },
        status: {
            pending: "PENDING",
            confirmed: "CONFIRMED"
        },
        actions: {
            accept: "Accept",
            decline: "Reject",
            submitRequest: "Submit Request",
            recyclingGuide: "Recycling Guide",
            gotIt: "Got it!",
            doRecycle: "DO Recycle",
            dontRecycle: "DON'T Recycle",
            addToCart: "Add to cart",
            addMoreItems: "+ Add more items",
            reviewAddress: "Review Address",
            shareLocation: "Share Location",
            confirmCollection: "Confirm Collection",
            grantPermission: "Grant Permission",
            openSettings: "Open Settings",
            signInGoogle: "Sign in with Google",
            skip: "Skip",
            viewCart: "View your cart",
            confirmCollectPoints: "Confirm & Collect Points",
            incorrectWeight: "Incorrect Weight?",
            requestSent: "Request Sent!",
            waitingForCollector: "Waiting for a collector to accept...",
            collectionVerified: "Collection Verified!",
            youEarnedPoints: "You earned {points} points for recycling {weight}kg!",
            error: "Error",
            success: "Great Move!",
            verifyCollection: "Verify Collection"
        },
        messages: {
            collectorWeighed: "The collector has weighed your items:",
            waitingForVerification: "Please wait for the collector to verify the weight.",
            locationNotFound: "Location not found",
            waitLocation: "Please wait for your location to be detected.",
            analysisFailed: "Analysis failed",
            failAnalyze: "Failed to analyze image.",
            failConfirm: "Failed to confirm collection. Please try again.",
            scrollTip: "Scroll down on Home to see Recent Activity."
        },
        scanner: {
            instruction: "Scan recycle items",
            permissionRequired: "Camera permission is required to scan items."
        },
        result: {
            savedCO2: "SAVED CO₂",
            material: "MATERIAL",
            points: "POINTS"
        },
        cart: {
            title: "My Cart"
        },
        tracking: {
            confirmPickup: "Confirm Pickup",
            shareInstruction: "Share your location to request a collector.",
            arrived: "Collector has arrived!",
            onTheWay: "Collector is on the way",
            lessThanMinute: "Less than a minute",
            mins: "mins"
        },
        auth: {
            selectRole: "Select your role to continue",
            signingInAs: "Signing in as",
            roles: {
                contributor: "Contributor",
                collector: "Collector",
                admin: "Admin"
            }
        },
        onboarding: {
            slide1: {
                title: "Easily schedule your recyclables for collection",
                desc: "Contributors can post recyclable items like paper, glass, and plastic for nearby collectors to pick up."
            },
            slide2: {
                title: "Track your collection progress",
                desc: "See which items are picked up and when, keeping you updated in real-time."
            },
            slide3: {
                title: "Earn rewards for recycling",
                desc: "Get points for every item you recycle and redeem them for exciting rewards."
            }
        },
        guide: {
            plastic: {
                title: "Plastic",
                dos: ['PET Bottles (cleaned)', 'Hard Plastic Containers', 'Milk Jugs'],
                donts: ['Plastic Wrappers/Bags', 'Styrofoam', 'Dirty/Oily Containers', 'Straws & Cutlery']
            },
            glass: {
                title: "Glass",
                dos: ['Glass Bottles (any color)', 'Jars (jam, sauce)', 'Cosmetic Bottles'],
                donts: ['Broken Glass', 'Lightbulbs', 'Mirrors', 'Ceramics/Pyrex']
            },
            aluminium: {
                title: "Aluminium",
                dos: ['Drink Cans', 'Clean Foil', 'Food Tins'],
                donts: ['Dirty/Greasy Foil', 'Aerosol Cans (if hazardous)', 'Scrap Metal with plastic parts']
            },
            paper: {
                title: "Paper",
                dos: ['Newspapers & Magazines', 'Cardboard Boxes (flattened)', 'Office Paper'],
                donts: ['Pizza Boxes (greasy)', 'Tissues/Napkins', 'Wax-coated cups', 'Shredded paper (confetti)']
            }
        },
        collector: {
            startNav: "Start Navigation",
            chooseNav: "Choose Navigation App",
            searchNow: "Find Jobs",
            verifyCollection: "Verify Collection",
            enterWeight: "Enter Weight",
            noJobs: "No jobs nearby",
            noContributor: "No contributors found",
            waitingConfirmation: "Waiting for Contributor to confirm...",
            checkApp: "Ask them to check their app.",
            cancelRequest: "Cancel Request"
        },
        common: {
            cancel: "Cancel",
            error: "Error",
            success: "Success",
            loading: "Loading...",
            tip: "Tip"
        },
        earnings: {
            title: "Earnings",
            balance: "Wallet Balance",
            withdraw: "Withdraw",
            withdrawFeatureSoon: "Withdrawal feature coming soon!",
            noEarnings: "No earnings yet",
            recentActivity: "Recent Activity"
        },
        inbox: {
            title: "Inbox",
            noMessages: "No messages yet"
        },
        tabs: {
            home: "Home",
            earnings: "Earnings",
            inbox: "Inbox",
            account: "Account",
            stations: "Stations",
            store: "Store"
        }
    },
    zh: {
        home: {
            welcome: "欢迎",
            points: "积分",
            savedCO2: "减少的碳排放",
            recycled: "已回收",
            recentActivity: "最近活动",
            dailyTip: "每日环保小贴士",
            noActivity: "最近没有回收记录",
            kgRecycled: "公斤 已回收",
            viewDetails: "查看详情",
            itemsRecycled: "回收物品",
            close: "关闭",
            goodMorning: "早上好，",
            environmentalImpact: "环境影响",
            thisMonth: "本月",
            recycleNow: "立即回收",
            viewAll: "查看全部",
            noProcessingActivity: "无近期处理活动。"
        },
        collector: {
            startNav: "开始导航",
            chooseNav: "选择导航应用",
            searchNow: "寻找工作",
            verifyCollection: "验证回收",
            enterWeight: "输入重量",
            noJobs: "附近没有工作",
            noContributor: "未找到贡献者",
            waitingConfirmation: "等待贡献者确认...",
            checkApp: "请让他们查看应用程序。",
            cancelRequest: "取消请求"
        },
        common: {
            cancel: "取消",
            error: "错误",
            success: "成功",
            loading: "加载中...",
            tip: "提示"
        },
        earnings: {
            title: "收益",
            balance: "钱包余额",
            withdraw: "提现",
            withdrawFeatureSoon: "提现功能即将推出！",
            noEarnings: "暂无收益",
            recentActivity: "最近活动"
        },
        inbox: {
            title: "收件箱",
            noMessages: "暂无消息"
        },
        tabs: {
            home: "首页",
            earnings: "收益",
            inbox: "收件箱",
            account: "账户",
            stations: "站点",
            store: "商店"
        },
        profile: {
            title: "我的资料",
            level: {
                novice: "环保新手",
                warrior: "环保卫土",
                master: "地球守护者",
                legend: "可持续发展传奇"
            },
            nextLevel: "距离下一级还有 {points} 分",
            settings: "设置",
            darkMode: "深色模式",
            language: "语言",
            support: "帮助与支持",
            logout: "退出登录",
            viewHistory: "交易历史",
            developer: "开发者",
            github: "GitHub",
            email: "电子邮件"
        },
        tips: {
            didYouKnow: "你知道吗？",
            tip1: "回收一个铝罐节省的能量足够让电视运行3小时！",
            tip2: "玻璃可以100%回收，并且可以无限次回收而不损失质量。",
            tip3: "冲洗可回收物可以防止污染，确保它们被回收。",
        },
        materials: {
            plastic: "塑料",
            glass: "玻璃",
            aluminium: "铝罐",
            paper: "纸张"
        },
        status: {
            pending: "处理中",
            confirmed: "已确认"
        },
        actions: {
            accept: "接受",
            decline: "拒绝",
            submitRequest: "提交请求",
            recyclingGuide: "回收指南",
            gotIt: "明白了！",
            doRecycle: "✅ 可回收",
            dontRecycle: "❌ 不可回收",
            addToCart: "加入购物车",
            addMoreItems: "+ 添加更多物品",
            reviewAddress: "确认地址",
            shareLocation: "分享位置",
            confirmCollection: "确认回收",
            grantPermission: "授予权限",
            openSettings: "打开设置",
            signInGoogle: "使用 Google 登录",
            skip: "跳过",
            viewCart: "查看购物车",
            confirmCollectPoints: "确认并收集积分",
            incorrectWeight: "重量不正确？",
            requestSent: "请求已发送！",
            waitingForCollector: "正在等待回收员接受...",
            collectionVerified: "回收已验证！",
            youEarnedPoints: "您回收了 {weight} 公斤，赚取了 {points} 积分！",
            error: "错误",
            success: "太棒了！",
            verifyCollection: "验证回收"
        },
        messages: {
            collectorWeighed: "回收员已称重您的物品：",
            waitingForVerification: "请等待回收员验证重量。",
            locationNotFound: "未找到位置",
            waitLocation: "请等待位置检测完成。",
            analysisFailed: "分析失败",
            failAnalyze: "无法分析图片。",
            failConfirm: "无法确认回收。请重试。",
            scrollTip: "向下滚动首页查看最近活动。"
        },
        scanner: {
            instruction: "扫描回收物品",
            permissionRequired: "需要相机权限才能扫描物品。"
        },
        result: {
            savedCO2: "减少碳排放",
            material: "材质",
            points: "积分"
        },
        cart: {
            title: "我的购物车"
        },
        tracking: {
            confirmPickup: "确认取件",
            shareInstruction: "分享您的位置以呼叫回收员。",
            arrived: "回收员已到达！",
            onTheWay: "回收员在路上了",
            lessThanMinute: "少于一分钟",
            mins: "分钟"
        },
        auth: {
            selectRole: "选择您的角色以继续",
            signingInAs: "登录身份",
            roles: {
                contributor: "贡献者",
                collector: "回收员",
                admin: "管理员"
            }
        },
        onboarding: {
            slide1: {
                title: "轻松安排回收物品",
                desc: "贡献者可以发布纸张、玻璃和塑料等可回收物品，供附近的回收员上门收集。"
            },
            slide2: {
                title: "追踪回收进度",
                desc: "实时查看哪些物品被收集以及收集时间。"
            },
            slide3: {
                title: "回收赚取奖励",
                desc: "为您回收的每件物品赚取积分，并兑换激动人心的奖励。"
            }
        },
        guide: {
            plastic: {
                title: "塑料",
                dos: ['PET 瓶 (清洗干净)', '硬塑料容器', '牛奶壶'],
                donts: ['塑料包装/袋子', '保丽龙', '脏/油腻的容器', '吸管和餐具']
            },
            glass: {
                title: "玻璃",
                dos: ['玻璃瓶 (任何颜色)', '罐子 (果酱, 酱料)', '化妆品瓶'],
                donts: ['碎玻璃', '灯泡', '镜子', '陶瓷/耐热玻璃']
            },
            aluminium: {
                title: "铝制品",
                dos: ['饮料罐', '干净的铝箔', '食品罐头'],
                donts: ['脏/油腻的铝箔', '喷雾罐 (如有害)', '带有塑料部件的废金属']
            },
            paper: {
                title: "纸张",
                dos: ['报纸和杂志', '纸箱 (压扁)', '办公用纸'],
                donts: ['披萨盒 (油腻)', '面纸/餐巾', '涂蜡杯', '碎纸 (纸屑)']
            }
        }
    },
    ms: {
        home: {
            welcome: "Selamat Datang",
            points: "MATA",
            savedCO2: "CO2 DIJIMATKAN",
            recycled: "DIKITAR SEMULA",
            recentActivity: "Aktiviti Terkini",
            dailyTip: "Tip Eco Harian",
            noActivity: "Tiada aktiviti kitar semula baru-baru ini",
            kgRecycled: "kg Dikitar Semula",
            viewDetails: "Lihat Butiran",
            itemsRecycled: "Barang Dikitar Semula",
            close: "Tutup",
            goodMorning: "Selamat Pagi,",
            environmentalImpact: "KESAN ALAM SEKITAR",
            thisMonth: "Bulan Ini",
            recycleNow: "Kitar Semula Sekarang",
            viewAll: "Lihat Semua",
            noProcessingActivity: "Tiada aktiviti pemprosesan terkini."
        },
        collector: {
            startNav: "Mulakan Navigasi",
            chooseNav: "Pilih Aplikasi Navigasi",
            searchNow: "Cari Kerja",
            verifyCollection: "Sahkan Kutipan",
            enterWeight: "Masukkan Berat",
            noJobs: "Tiada kerja berdekatan",
            noContributor: "Tiada penyumbang ditemui",
            waitingConfirmation: "Menunggu Penyumbang sahkan...",
            checkApp: "Minta mereka semak aplikasi.",
            cancelRequest: "Batal Permintaan"
        },
        common: {
            cancel: "Batal",
            error: "Ralat",
            success: "Berjaya",
            loading: "Memuatkan...",
            tip: "Tip"
        },
        earnings: {
            title: "Pendapatan",
            balance: "Baki Dompet",
            withdraw: "Pengeluaran",
            withdrawFeatureSoon: "Ciri pengeluaran akan datang tidak lama lagi!",
            noEarnings: "Tiada pendapatan lagi",
            recentActivity: "Aktiviti Terkini"
        },
        inbox: {
            title: "Peti Masuk",
            noMessages: "Tiada mesej lagi"
        },
        tabs: {
            home: "Utama",
            earnings: "Pendapatan",
            inbox: "Peti Masuk",
            account: "Akaun",
            stations: "Stesen",
            store: "Kedai"
        },
        profile: {
            title: "Profil Saya",
            level: {
                novice: "Pemula Eco",
                warrior: "Pejuang Eco",
                master: "Penjaga Bumi",
                legend: "Lagenda Kelestarian"
            },
            nextLevel: "{points} mata ke tahap seterusnya",
            settings: "Tetapan",
            darkMode: "Mod Gelap",
            language: "Bahasa",
            support: "Bantuan & Sokongan",
            logout: "Log Keluar",
            viewHistory: "Sejarah Transaksi",
            developer: "Pembangun",
            github: "GitHub",
            email: "Emel"
        },
        tips: {
            didYouKnow: "Tahukah Anda?",
            tip1: "Mengitar semula satu tin aluminium menjimatkan tenaga untuk menghidupkan TV selama 3 jam!",
            tip2: "Kaca boleh dikitar semula 100% tanpa kehilangan kualiti.",
            tip3: "Membilas barang kitar semula mengelakkan pencemaran dan memastikan ia dikitar semula.",
        },
        materials: {
            plastic: "Plastik",
            glass: "Kaca",
            aluminium: "Aluminium",
            paper: "Kertas"
        },
        status: {
            pending: "MENUNGGU",
            confirmed: "DISAHKAN"
        },
        actions: {
            accept: "Terima",
            decline: "Tolak",
            submitRequest: "Hantar Permintaan",
            recyclingGuide: "Panduan Kitar Semula",
            gotIt: "Faham!",
            doRecycle: "✅ Boleh Kitar Semula",
            dontRecycle: "❌ Tidak Boleh",
            addToCart: "Tambah ke Troli",
            addMoreItems: "+ Tambah Barang",
            reviewAddress: "Semak Alamat",
            shareLocation: "Kongsi Lokasi",
            confirmCollection: "Sahkan Kutipan",
            grantPermission: "Beri Kebenaran",
            openSettings: "Buka Tetapan",
            signInGoogle: "Log masuk dengan Google",
            skip: "Langkau",
            viewCart: "Lihat troli anda",
            confirmCollectPoints: "Sahkan & Kumpul Mata",
            incorrectWeight: "Berat Salah?",
            requestSent: "Permintaan Dihantar!",
            waitingForCollector: "Menunggu pengutip untuk menerima...",
            collectionVerified: "Kutipan Disahkan!",
            youEarnedPoints: "Anda memperoleh {points} mata untuk kitar semula {weight}kg!",
            error: "Ralat",
            success: "Hebat!",
            verifyCollection: "Sahkan Kutipan"
        },
        messages: {
            collectorWeighed: "Pengutip telah menimbang barang anda:",
            waitingForVerification: "Sila tunggu pengutip mengesahkan berat.",
            locationNotFound: "Lokasi tidak dijumpai",
            waitLocation: "Sila tunggu lokasi anda dikesan.",
            analysisFailed: "Analisis gagal",
            failAnalyze: "Gagal menganalisis imej.",
            failConfirm: "Gagal mengesahkan kutipan. Sila cuba lagi.",
            scrollTip: "Tatal ke bawah di Utama untuk melihat Aktiviti Terkini."
        },
        scanner: {
            instruction: "Imbas barang kitar semula",
            permissionRequired: "Kebenaran kamera diperlukan untuk mengimbas."
        },
        result: {
            savedCO2: "CO₂ DIJIMATKAN",
            material: "BAHAN",
            points: "MATA"
        },
        cart: {
            title: "Troli Saya"
        },
        tracking: {
            confirmPickup: "Sahkan Pengambilan",
            shareInstruction: "Kongsi lokasi anda untuk meminta pengutip.",
            arrived: "Pengutip telah tiba!",
            onTheWay: "Pengutip dalam perjalanan",
            lessThanMinute: "Kurang dari seminit",
            mins: "minit"
        },
        auth: {
            selectRole: "Pilih peranan anda untuk teruskan",
            signingInAs: "Melog masuk sebagai",
            roles: {
                contributor: "Penyumbang",
                collector: "Pengutip",
                admin: "Pentadbir"
            }
        },
        onboarding: {
            slide1: {
                title: "Jadualkan kutipan kitar semula dengan mudah",
                desc: "Penyumbang boleh pos barang kitar semula seperti kertas, kaca, dan plastik untuk diambil oleh pengutip berdekatan."
            },
            slide2: {
                title: "Jejak kemajuan kutipan anda",
                desc: "Lihat barang mana yang diambil dan bila, memastikan anda sentiasa dikemaskini dalam masa nyata."
            },
            slide3: {
                title: "Dapatkan ganjaran kitar semula",
                desc: "Dapatkan mata bagi setiap barang yang anda kitar semula dan tebus ganjaran menarik."
            }
        },
        guide: {
            plastic: {
                title: "Plastik",
                dos: ['Botol PET (dibersihkan)', 'Bekas Plastik Keras', 'Jag Susu'],
                donts: ['Pembungkus/Beg Plastik', 'Polisterin', 'Bekas Kotor/Berminyak', 'Penyedut & Kutleri']
            },
            glass: {
                title: "Kaca",
                dos: ['Botol Kaca (sebarang warna)', 'Balang (jem, sos)', 'Botol Kosmetik'],
                donts: ['Kaca Pecah', 'Mentol', 'Cermin', 'Seramik/Pyrex']
            },
            aluminium: {
                title: "Aluminium",
                dos: ['Tin Minuman', 'Kerajang Bersih', 'Tin Makanan'],
                donts: ['Kerajang Kotor/Berminyak', 'Tin Aerosol (berbahaya)', 'Sisa Logam dengan bahagian plastik']
            },
            paper: {
                title: "Kertas",
                dos: ['Surat Khabar & Majalah', 'Kotak Kadbod (diratakan)', 'Kertas Pejabat'],
                donts: ['Kotak Pizza (berminyak)', 'Tisu/Napkin', 'Cawan bersalut lilin', 'Kertas hancur']
            }
        }
    }
};
