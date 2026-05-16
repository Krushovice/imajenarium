"""Seed data for the books catalog — ~30 emotionally rich titles."""
from __future__ import annotations

SEED_BOOKS: list[dict] = [
    {
        "title": "Мастер и Маргарита",
        "author": "Михаил Булгаков",
        "description": (
            "Дьявол приходит в советскую Москву, сея хаос и обнажая человеческую природу. "
            "Роман о любви, творчестве, свободе и вечном противостоянии добра и зла."
        ),
        "published_year": 1967,
        "language": "ru",
        "page_count": 480,
        "emotional_tags": ["dark", "magical", "satirical", "romantic", "philosophical", "melancholy"],
        "ai_summary": "Мистический роман о визите Сатаны в Москву, переплетённый с историей Понтия Пилата.",
    },
    {
        "title": "Преступление и наказание",
        "author": "Фёдор Достоевский",
        "description": (
            "Студент Раскольников совершает убийство и живёт в психологическом аду. "
            "Глубокое исследование вины, морали и искупления."
        ),
        "published_year": 1866,
        "language": "ru",
        "page_count": 671,
        "emotional_tags": ["dark", "psychological", "philosophical", "tense", "heavy", "redemption"],
        "ai_summary": "Психологическая драма о преступлении, вине и духовном возрождении.",
    },
    {
        "title": "Сто лет одиночества",
        "author": "Габриэль Гарсиа Маркес",
        "description": (
            "Магическая сага о семье Буэндиа и городе Макондо — о времени, памяти, судьбе "
            "и неизбежном одиночестве человека."
        ),
        "published_year": 1967,
        "language": "ru",
        "page_count": 448,
        "emotional_tags": ["magical", "melancholy", "epic", "romantic", "nostalgic", "philosophical"],
        "ai_summary": "Магический реализм о судьбах поколений семьи в вымышленном латиноамериканском городе.",
    },
    {
        "title": "Маленький принц",
        "author": "Антуан де Сент-Экзюпери",
        "description": (
            "Философская сказка о мальчике с далёкой звезды, путешествующем по планетам. "
            "О любви, одиночестве, ответственности и смысле жизни."
        ),
        "published_year": 1943,
        "language": "ru",
        "page_count": 96,
        "emotional_tags": ["tender", "philosophical", "nostalgic", "warm", "melancholy", "wonder"],
        "ai_summary": "Философская притча о любви и одиночестве, написанная как детская сказка.",
    },
    {
        "title": "1984",
        "author": "Джордж Оруэлл",
        "description": (
            "Тоталитарное будущее, где Старший Брат следит за каждым. "
            "История сопротивления, любви и сломленного духа."
        ),
        "published_year": 1949,
        "language": "ru",
        "page_count": 328,
        "emotional_tags": ["dark", "dystopian", "tense", "oppressive", "romantic", "tragic"],
        "ai_summary": "Антиутопия о тоталитарном обществе, любви и невозможности сопротивления системе.",
    },
    {
        "title": "Дюна",
        "author": "Фрэнк Герберт",
        "description": (
            "Эпическая история пустынной планеты Арракис — о политике, религии, экологии "
            "и пробуждении мессии."
        ),
        "published_year": 1965,
        "language": "ru",
        "page_count": 896,
        "emotional_tags": ["epic", "adventure", "philosophical", "tense", "mystical", "wonder"],
        "ai_summary": "Научно-фантастическая эпопея о политике, экологии и судьбе на пустынной планете.",
    },
    {
        "title": "Норвежский лес",
        "author": "Харуки Мураками",
        "description": (
            "История студента Тору Ватанабэ о потере, любви и взрослении в 1960-е. "
            "Роман-воспоминание, пронизанный меланхолией и нежностью."
        ),
        "published_year": 1987,
        "language": "ru",
        "page_count": 296,
        "emotional_tags": ["melancholy", "romantic", "nostalgic", "tender", "slow", "loss"],
        "ai_summary": "Роман о любви и утрате в Токио 1960-х, наполненный ностальгией и меланхолией.",
    },
    {
        "title": "Гордость и предубеждение",
        "author": "Джейн Остин",
        "description": (
            "История Элизабет Беннет и мистера Дарси — о любви, классовых предрассудках "
            "и силе характера."
        ),
        "published_year": 1813,
        "language": "ru",
        "page_count": 432,
        "emotional_tags": ["romantic", "witty", "cozy", "satirical", "warm", "humor"],
        "ai_summary": "Классический роман о любви и социальных условностях в Англии XIX века.",
    },
    {
        "title": "Граф Монте-Кристо",
        "author": "Александр Дюма",
        "description": (
            "Эдмон Дантес несправедливо заключён в тюрьму, а после бегства посвящает жизнь "
            "изощрённой мести. Захватывающая сага о справедливости и трансформации."
        ),
        "published_year": 1844,
        "language": "ru",
        "page_count": 1276,
        "emotional_tags": ["adventure", "dramatic", "tense", "dark", "triumphant", "epic"],
        "ai_summary": "Авантюрный роман о мести, справедливости и трансформации личности.",
    },
    {
        "title": "Анна Каренина",
        "author": "Лев Толстой",
        "description": (
            "Трагическая история любви Анны Карениной и офицера Вронского на фоне "
            "русского общества XIX века."
        ),
        "published_year": 1878,
        "language": "ru",
        "page_count": 864,
        "emotional_tags": ["tragic", "romantic", "philosophical", "dramatic", "dark", "social"],
        "ai_summary": "Трагедия о запретной любви и её разрушительных последствиях в российском обществе.",
    },
    {
        "title": "Над пропастью во ржи",
        "author": "Джером Сэлинджер",
        "description": (
            "Три дня жизни Холдена Колфилда после отчисления — взгляд на взрослый мир "
            "глазами подростка, отвергающего фальшь."
        ),
        "published_year": 1951,
        "language": "ru",
        "page_count": 277,
        "emotional_tags": ["melancholy", "rebellious", "nostalgic", "tender", "cynical", "loss"],
        "ai_summary": "Культовый роман о подростковом отчуждении и поиске подлинности.",
    },
    {
        "title": "Убить пересмешника",
        "author": "Харпер Ли",
        "description": (
            "История об адвокате Аттикусе Финче, защищающем чернокожего мужчину в расистском "
            "обществе американского Юга."
        ),
        "published_year": 1960,
        "language": "ru",
        "page_count": 336,
        "emotional_tags": ["warm", "moral", "tender", "social", "nostalgic", "courage"],
        "ai_summary": "Роман о справедливости, расизме и детской невинности на Американском Юге.",
    },
    {
        "title": "Алхимик",
        "author": "Пауло Коэльо",
        "description": (
            "Пастух Сантьяго отправляется в путешествие в поисках сокровищ, "
            "открывая душу мира и следуя своей Путеводной звезде."
        ),
        "published_year": 1988,
        "language": "ru",
        "page_count": 197,
        "emotional_tags": ["philosophical", "warm", "wonder", "adventure", "spiritual", "hopeful"],
        "ai_summary": "Духовная притча о поиске судьбы и следовании мечте.",
    },
    {
        "title": "Автостопом по Галактике",
        "author": "Дуглас Адамс",
        "description": (
            "Земля уничтожена ради строительства гиперпространственного шоссе. "
            "Артур Дент путешествует по вселенной, ища смысл жизни (ответ: 42)."
        ),
        "published_year": 1979,
        "language": "ru",
        "page_count": 224,
        "emotional_tags": ["humor", "absurd", "adventure", "witty", "philosophical", "light"],
        "ai_summary": "Комедийная фантастика о путешествии по галактике в поисках смысла жизни.",
    },
    {
        "title": "Процесс",
        "author": "Франц Кафка",
        "description": (
            "Йозеф К. арестован и судим за неизвестное преступление. "
            "Гнетущая история о бюрократии, абсурде и бессилии человека перед системой."
        ),
        "published_year": 1925,
        "language": "ru",
        "page_count": 304,
        "emotional_tags": ["dark", "absurd", "oppressive", "tense", "philosophical", "anxious"],
        "ai_summary": "Абсурдистский роман о человеке, судимом без объяснений, против безликой системы.",
    },
    {
        "title": "Портрет Дориана Грея",
        "author": "Оскар Уайльд",
        "description": (
            "Красивый юноша продаёт душу за вечную молодость. "
            "Портрет стареет вместо него, отражая каждый его грех."
        ),
        "published_year": 1890,
        "language": "ru",
        "page_count": 253,
        "emotional_tags": ["dark", "aesthetic", "decadent", "philosophical", "dramatic", "horror"],
        "ai_summary": "Готический роман о красоте, моральной деградации и цене бессмертия.",
    },
    {
        "title": "Тихий Дон",
        "author": "Михаил Шолохов",
        "description": (
            "Судьба казака Григория Мелехова и его семьи сквозь революцию и гражданскую войну. "
            "Эпос о любви, войне и потере."
        ),
        "published_year": 1940,
        "language": "ru",
        "page_count": 1520,
        "emotional_tags": ["epic", "tragic", "romantic", "war", "dark", "nostalgic"],
        "ai_summary": "Эпический роман о казацкой жизни в годы революции и гражданской войны.",
    },
    {
        "title": "Игра в бисер",
        "author": "Герман Гессе",
        "description": (
            "Утопический мир Касталии, где интеллектуальная элита посвящает себя Игре — "
            "синтезу всех человеческих знаний."
        ),
        "published_year": 1943,
        "language": "ru",
        "page_count": 528,
        "emotional_tags": ["philosophical", "meditative", "intellectual", "slow", "wonder", "aesthetic"],
        "ai_summary": "Роман-размышление об искусстве, интеллекте и смысле духовного служения.",
    },
    {
        "title": "Бесы",
        "author": "Фёдор Достоевский",
        "description": (
            "Политический роман о революционной ячейке в провинциальном городе. "
            "Достоевский предугадал разрушительную силу нигилизма и терроризма."
        ),
        "published_year": 1872,
        "language": "ru",
        "page_count": 768,
        "emotional_tags": ["dark", "tense", "psychological", "political", "philosophical", "heavy"],
        "ai_summary": "Пророческий роман о нигилизме, терроризме и демонах русской революции.",
    },
    {
        "title": "Имя розы",
        "author": "Умберто Эко",
        "description": (
            "Монах-детектив Вильгельм Баскервильский расследует убийства в средневековом "
            "монастыре. Интеллектуальный детектив о знаках, смысле и истине."
        ),
        "published_year": 1980,
        "language": "ru",
        "page_count": 592,
        "emotional_tags": ["intellectual", "mysterious", "tense", "dark", "philosophical", "historical"],
        "ai_summary": "Интеллектуальный детектив в средневековом монастыре — о знании, власти и тайне.",
    },
    {
        "title": "Атлант расправил плечи",
        "author": "Айн Рэнд",
        "description": (
            "Антиутопия об Америке, где лучшие умы исчезают один за другим. "
            "Манифест объективизма и философии индивидуализма."
        ),
        "published_year": 1957,
        "language": "ru",
        "page_count": 1168,
        "emotional_tags": ["philosophical", "dramatic", "tense", "romantic", "epic", "ideological"],
        "ai_summary": "Философский роман-манифест об индивидуализме, творчестве и свободе духа.",
    },
    {
        "title": "Солярис",
        "author": "Станислав Лем",
        "description": (
            "Учёные исследуют планету-океан Солярис, способный материализовать воспоминания. "
            "Глубокий роман о непознаваемости иного разума."
        ),
        "published_year": 1961,
        "language": "ru",
        "page_count": 288,
        "emotional_tags": ["philosophical", "melancholy", "mysterious", "slow", "wonder", "existential"],
        "ai_summary": "Философская фантастика о контакте с непознаваемым разумом и границах человеческого познания.",
    },
    {
        "title": "Мы",
        "author": "Евгений Замятин",
        "description": (
            "Единое государство, где нет имён — только номера. "
            "Первая антиутопия, вдохновившая Оруэлла и Хаксли."
        ),
        "published_year": 1924,
        "language": "ru",
        "page_count": 224,
        "emotional_tags": ["dark", "dystopian", "tense", "romantic", "philosophical", "oppressive"],
        "ai_summary": "Родоначальница антиутопии — о свободе, любви и бунте против тотального контроля.",
    },
    {
        "title": "Бойня номер пять",
        "author": "Курт Воннегут",
        "description": (
            "Билли Пилигрим путешествует во времени между Дрезденом 1945 года и планетой Тральфамадор. "
            "Антивоенный роман с чёрным юмором и горькой иронией."
        ),
        "published_year": 1969,
        "language": "ru",
        "page_count": 215,
        "emotional_tags": ["dark", "humor", "absurd", "anti-war", "philosophical", "melancholy"],
        "ai_summary": "Антивоенный роман о бомбардировке Дрездена через призму абсурдизма и чёрного юмора.",
    },
    {
        "title": "Тысяча сияющих солнц",
        "author": "Халед Хоссейни",
        "description": (
            "Две афганские женщины, связанные судьбой и войной. "
            "Роман о выживании, дружбе и непоколебимой надежде."
        ),
        "published_year": 2007,
        "language": "ru",
        "page_count": 432,
        "emotional_tags": ["tragic", "hopeful", "war", "tender", "dark", "courage"],
        "ai_summary": "История двух афганских женщин, объединённых войной — о страдании, силе и любви.",
    },
    {
        "title": "Шантарам",
        "author": "Грегори Дэвид Робертс",
        "description": (
            "Австралийский беглый заключённый скрывается в трущобах Бомбея. "
            "Эпическое приключение о свободе, преступлении и искуплении."
        ),
        "published_year": 2003,
        "language": "ru",
        "page_count": 944,
        "emotional_tags": ["adventure", "dark", "romantic", "philosophical", "tense", "epic"],
        "ai_summary": "Автобиографический роман-приключение о жизни в трущобах Бомбея и поиске искупления.",
    },
    {
        "title": "Пикник на обочине",
        "author": "Аркадий и Борис Стругацкие",
        "description": (
            "Сталкеры пробираются в Зону — место после инопланетного визита. "
            "Роман о смысле, природе счастья и цене мечты."
        ),
        "published_year": 1972,
        "language": "ru",
        "page_count": 224,
        "emotional_tags": ["philosophical", "mysterious", "tense", "dark", "existential", "wonder"],
        "ai_summary": "Философская фантастика об артефактах инопланетной цивилизации и природе человеческого желания.",
    },
    {
        "title": "The Road",
        "author": "Кормак Маккарти",
        "description": (
            "Отец и сын бредут через пепельный постапокалипсис. "
            "Роман о любви в конце света — невыносимо тёмный и невыносимо красивый."
        ),
        "published_year": 2006,
        "language": "ru",
        "page_count": 287,
        "emotional_tags": ["dark", "tender", "tragic", "survival", "love", "hopeful"],
        "ai_summary": "Постапокалиптический роман о безусловной любви отца и сына в мире после катастрофы.",
    },
    {
        "title": "Лолита",
        "author": "Владимир Набоков",
        "description": (
            "Профессор Гумберт Гумберт одержим двенадцатилетней девочкой. "
            "Шедевр стиля и один из самых неоднозначных романов XX века."
        ),
        "published_year": 1955,
        "language": "ru",
        "page_count": 368,
        "emotional_tags": ["dark", "aesthetic", "controversial", "melancholy", "tragic", "literary"],
        "ai_summary": "Скандальный шедевр о навязчивой страсти — блестящий стилистически и морально тяжёлый.",
    },
    {
        "title": "Война и мир",
        "author": "Лев Толстой",
        "description": (
            "Эпопея о судьбах русского дворянства в эпоху наполеоновских войн. "
            "Величайший роман о жизни, смерти, любви и истории."
        ),
        "published_year": 1869,
        "language": "ru",
        "page_count": 1296,
        "emotional_tags": ["epic", "romantic", "philosophical", "war", "nostalgic", "dramatic"],
        "ai_summary": "Грандиозная эпопея о жизни, любви и войне в России эпохи Наполеона.",
    },
]
