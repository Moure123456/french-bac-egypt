/* ==========================================================
   الأدب الفرنسي العالمي والمكتبة الثقافية  —  Le Français Au Bac
   ملف مستقل. أضِفه قبل </body> في index.html:
   <script src="litterature.js"></script>
   يملأ تبويب "Littérature française" مكان بطاقة "المحتوى قيد الإعداد".
   ========================================================== */
(function () {
  'use strict';

  /* ====================== البيانات ====================== */
  // [الاسم، التواريخ، العصر(old/new)، النص الفرنسي، الترجمة العربية، اقتباس، ترجمة الاقتباس]
  var LIT = [
    [`La Chanson de Roland`, `XIe siècle`, 'old', `Poème épique anonyme du Moyen Âge. Il raconte la mort du chevalier Roland, neveu de Charlemagne, à Roncevaux en 778.`, `قصيدة ملحمية مجهولة المؤلف من العصور الوسطى. تروي موت الفارس رولان، ابن أخت شارلمان، في رونسفو عام 778.`, ``, ``],
    [`François Villon`, `v. 1431 – après 1463`, 'old', `Poète du Moyen Âge, célèbre pour sa «Ballade des pendus». Sa vie est pleine d'aventures et de problèmes avec la justice.`, `شاعر من العصور الوسطى، اشتهر بقصيدته «أنشودة المشنوقين». كانت حياته مليئة بالمغامرات والمشكلات مع القضاء.`, ``, ``],
    [`Pierre de Ronsard`, `1524 – 1585`, 'old', `Prince des poètes de la Renaissance et chef de la Pléiade. Il chante l'amour, la nature et le temps qui passe.`, `أمير شعراء عصر النهضة وزعيم جماعة «لا بلياد». يتغنى بالحب والطبيعة ومرور الزمن.`, `Cueillez dès aujourd'hui les roses de la vie.`, `اقطفوا اليوم ورود الحياة.`],
    [`Molière`, `1622 – 1673`, 'old', `Auteur de comédies célèbres : «Tartuffe», «L'Avare», «Le Malade imaginaire». Il se moque des défauts des hommes pour les corriger.`, `كاتب كوميديات شهيرة: «طرطوف» و«البخيل» و«المريض الوهمي». يسخر من عيوب البشر ليصلحها.`, `Il faut manger pour vivre et non pas vivre pour manger.`, `يجب أن نأكل لنعيش، لا أن نعيش لنأكل.`],
    [`Jean de La Fontaine`, `1621 – 1695`, 'old', `Poète des «Fables», où les animaux parlent comme les hommes et donnent des leçons de morale.`, `شاعر «الخرافات» التي تتحدث فيها الحيوانات مثل البشر وتقدّم دروساً في الأخلاق.`, `La raison du plus fort est toujours la meilleure.`, `حجّة الأقوى هي دائماً الأفضل (وهو يسخر من الظلم).`],
    [`Jean Racine`, `1639 – 1699`, 'old', `Maître de la tragédie classique : «Andromaque», «Phèdre». Ses pièces montrent la passion et le destin.`, `أستاذ المأساة الكلاسيكية: «أندروماك» و«فيدر». تُظهر مسرحياته قوة العاطفة والقدر.`, ``, ``],
    [`Voltaire`, `1694 – 1778`, 'old', `Philosophe des Lumières. Il défend la tolérance et la liberté d'expression. Son conte «Candide» critique l'injustice et la guerre.`, `فيلسوف عصر التنوير. يدافع عن التسامح وحرية التعبير. تنتقد قصته «كانديد» الظلم والحرب.`, `Il faut cultiver notre jardin.`, `علينا أن نزرع حديقتنا (أي أن نعمل وننفع بدل الجدال الفارغ).`],
    [`Jean-Jacques Rousseau`, `1712 – 1778`, 'old', `Philosophe et écrivain né à Genève. Dans «Le Contrat social», il explique que le pouvoir appartient au peuple.`, `فيلسوف وكاتب وُلد في جنيف. في «العقد الاجتماعي» يشرح أن السلطة ملك للشعب.`, `L'homme est né libre, et partout il est dans les fers.`, `وُلد الإنسان حراً، وهو في كل مكان مكبّل بالقيود.`],
    [`Alexandre Dumas`, `1802 – 1870`, 'old', `Romancier d'aventures : «Les Trois Mousquetaires» et «Le Comte de Monte-Cristo» passionnent encore des millions de lecteurs.`, `روائي المغامرات: «الفرسان الثلاثة» و«الكونت دي مونت كريستو» ما زالتا تشوّقان ملايين القراء.`, `Tous pour un, un pour tous !`, `الجميع من أجل واحد، وواحد من أجل الجميع!`],
    [`Victor Hugo`, `1802 – 1885`, 'old', `Le plus grand écrivain romantique : poète, romancier et homme politique. Il a écrit «Notre-Dame de Paris» et «Les Misérables». Il défend les pauvres et s'oppose à la peine de mort.`, `أعظم أدباء الرومانسية: شاعر وروائي وسياسي. كتب «أحدب نوتردام» و«البؤساء». دافع عن الفقراء وعارض عقوبة الإعدام.`, `Ceux qui vivent, ce sont ceux qui luttent.`, `الأحياء حقاً هم الذين يناضلون.`],
    [`Honoré de Balzac`, `1799 – 1850`, 'old', `Il a écrit «La Comédie humaine», une immense série de romans qui décrit toute la société française du XIXe siècle.`, `كتب «الكوميديا الإنسانية»، سلسلة ضخمة من الروايات تصف المجتمع الفرنسي كله في القرن التاسع عشر.`, ``, ``],
    [`Charles Baudelaire`, `1821 – 1867`, 'old', `Poète des «Fleurs du mal», un recueil qui a changé la poésie moderne. Il parle de la beauté, de la ville et de la tristesse.`, `شاعر «أزهار الشر»، ديوان غيّر الشعر الحديث. يتحدث عن الجمال والمدينة والحزن.`, `Là, tout n'est qu'ordre et beauté, luxe, calme et volupté.`, `هناك، كل شيء نظام وجمال، ترف وهدوء ولذّة.`],
    [`Gustave Flaubert`, `1821 – 1880`, 'old', `«Madame Bovary» (1857) est un roman réaliste célèbre. Flaubert cherchait toujours «le mot juste».`, `«مدام بوفاري» (1857) رواية واقعية شهيرة. كان فلوبير يبحث دائماً عن «الكلمة الدقيقة».`, ``, ``],
    [`Jules Verne`, `1828 – 1905`, 'old', `Père de la science-fiction : «Vingt mille lieues sous les mers», «Le Tour du monde en quatre-vingts jours». Il a imaginé les sous-marins et les voyages vers la Lune.`, `أبو الخيال العلمي: «عشرون ألف فرسخ تحت الماء» و«حول العالم في ثمانين يوماً». تخيّل الغواصات والرحلات إلى القمر.`, ``, ``],
    [`Émile Zola`, `1840 – 1902`, 'old', `Chef du naturalisme. Dans «Germinal», il décrit la vie dure des mineurs. Sa lettre «J'accuse…!» (1898) défend le capitaine Dreyfus.`, `زعيم المدرسة الطبيعية. في «جيرمينال» يصف حياة عمال المناجم القاسية. ودافعت رسالته «إني أتهم…!» (1898) عن الضابط دريفوس.`, ``, ``],
    [`Guillaume Apollinaire`, `1880 – 1918`, 'new', `Poète moderne, auteur de «Alcools» et de «Calligrammes». Son poème «Le Pont Mirabeau» parle de l'amour qui passe comme l'eau de la Seine.`, `شاعر حديث، مؤلف «كحول» و«الخطّيات». تتحدث قصيدته «جسر ميرابو» عن الحب الذي يمرّ كمياه السين.`, ``, ``],
    [`Marcel Proust`, `1871 – 1922`, 'new', `«À la recherche du temps perdu» est un roman immense sur la mémoire : le goût d'une petite madeleine ramène les souvenirs d'enfance.`, `«بحثاً عن الزمن المفقود» رواية ضخمة عن الذاكرة: طعم قطعة «مادلين» صغيرة يعيد ذكريات الطفولة.`, ``, ``],
    [`Antoine de Saint-Exupéry`, `1900 – 1944`, 'new', `Aviateur et écrivain. «Le Petit Prince» (1943) est l'un des livres les plus traduits au monde.`, `طيّار وكاتب. «الأمير الصغير» (1943) من أكثر الكتب ترجمةً في العالم.`, `On ne voit bien qu'avec le cœur.`, `لا نرى جيداً إلا بالقلب.`],
    [`Albert Camus`, `1913 – 1960`, 'new', `Écrivain et philosophe né en Algérie, prix Nobel de littérature en 1957. «L'Étranger» (1942) raconte l'histoire d'un homme indifférent au monde.`, `كاتب وفيلسوف وُلد في الجزائر ونال نوبل للآداب عام 1957. تحكي «الغريب» (1942) قصة رجل لا مبالٍ بالعالم.`, ``, ``],
    [`Jean-Paul Sartre et Simone de Beauvoir`, `XXe siècle`, 'new', `Sartre est le chef de l'existentialisme ; il a refusé le prix Nobel en 1964. Beauvoir, avec «Le Deuxième Sexe» (1949), est une pionnière du féminisme.`, `سارتر زعيم الوجودية، ورفض جائزة نوبل عام 1964. وبوفوار بكتابها «الجنس الآخر» (1949) رائدة من رائدات الحركة النسوية.`, ``, ``],
    [`Le Clézio et Modiano`, `Prix Nobel 2008 et 2014`, 'new', `J.M.G. Le Clézio (Nobel 2008) écrit sur les voyages et les cultures du monde. Patrick Modiano (Nobel 2014) écrit sur la mémoire et le Paris de l'Occupation.`, `لو كليزيو (نوبل 2008) يكتب عن الرحلات وثقافات العالم. وباتريك موديانو (نوبل 2014) يكتب عن الذاكرة وباريس زمن الاحتلال.`, ``, ``],
    [`Annie Ernaux`, `née en 1940`, 'new', `Elle a reçu le prix Nobel de littérature en 2022. Elle écrit sur sa vie, sa famille et la société avec un style simple et direct.`, `نالت جائزة نوبل للآداب عام 2022. تكتب عن حياتها وأسرتها والمجتمع بأسلوب بسيط ومباشر.`, ``, ``],
    [`Leïla Slimani`, `née en 1981`, 'new', `Écrivaine franco-marocaine. Son roman «Chanson douce» a reçu le prix Goncourt en 2016.`, `كاتبة فرنسية مغربية. نالت روايتها «أغنية هادئة» جائزة الغونكور عام 2016.`, ``, ``]
  ];

  // نصوص مختصرة [العنوان، الفرنسي، العربي]
  var TEXTS = [
    [`Le Corbeau et le Renard (La Fontaine)`, `Un corbeau tient un fromage dans son bec. Un renard flatte le corbeau : « Quelle belle voix vous avez ! » Le corbeau ouvre le bec pour chanter et le fromage tombe. Le renard le mange et dit : « Tout flatteur vit aux dépens de celui qui l'écoute. »`, `غراب يمسك قطعة جبن بمنقاره. يمدح الثعلب الغراب: «ما أجمل صوتك!» ففتح الغراب منقاره ليغني فسقطت قطعة الجبن. أكلها الثعلب وقال: «كل متملّق يعيش على حساب من يصغي إليه».`],
    [`Candide (Voltaire)`, `Candide, un jeune homme naïf, croit que tout est pour le mieux dans le meilleur des mondes. Après de nombreux malheurs, il comprend qu'il vaut mieux travailler et cultiver son jardin.`, `كانديد شاب ساذج يعتقد أن كل شيء على أحسن ما يرام في أفضل العوالم. وبعد مصائب كثيرة يفهم أن الأفضل أن يعمل ويزرع حديقته.`],
    [`Les Misérables (Victor Hugo)`, `Jean Valjean a volé un pain et il a passé dix-neuf ans au bagne. À sa sortie, un évêque lui offre sa confiance. Valjean devient honnête et aide les pauvres, mais le policier Javert le poursuit sans cesse.`, `سرق جان فالجان رغيف خبز وقضى تسعة عشر عاماً في السجن. وعند خروجه منحه أسقف ثقته. صار فالجان شريفاً وساعد الفقراء، لكن الشرطي جافير ظلّ يطارده بلا توقف.`],
    [`Le Petit Prince (Saint-Exupéry)`, `Un pilote tombe en panne dans le désert. Il rencontre un petit garçon venu d'une autre planète. Le petit prince lui parle de sa rose et de ses voyages. À la fin, il explique que l'essentiel est invisible pour les yeux.`, `تتعطل طائرة طيّار في الصحراء، فيلتقي بصبي صغير جاء من كوكب آخر. يحدّثه الأمير الصغير عن وردته ورحلاته. وفي النهاية يشرح أن الجوهر لا تراه العيون.`]
  ];

  // [الاسم، التواريخ، المجال، فرنسي، عربي]
  var SAVANTS = [
    [`René Descartes`, `1596 – 1650`, `الفلسفة والرياضيات`, `Philosophe et mathématicien. Il a inventé la géométrie analytique (les coordonnées cartésiennes). Sa phrase célèbre : « Je pense, donc je suis. »`, `فيلسوف ورياضي. ابتكر الهندسة التحليلية (الإحداثيات الديكارتية). عبارته الشهيرة: «أنا أفكر، إذن أنا موجود».`],
    [`Blaise Pascal`, `1623 – 1662`, `الرياضيات والفيزياء`, `À 19 ans, il invente la Pascaline, l'une des premières machines à calculer. L'unité de pression, le pascal, porte son nom.`, `في التاسعة عشرة اخترع «الباسكالين»، إحدى أولى الآلات الحاسبة. وتحمل وحدة الضغط «باسكال» اسمه.`],
    [`Antoine Lavoisier`, `1743 – 1794`, `الكيمياء`, `Père de la chimie moderne. Il a établi la conservation de la masse et expliqué le rôle de l'oxygène dans la combustion. Il fut guillotiné pendant la Révolution.`, `أبو الكيمياء الحديثة. أثبت قانون حفظ الكتلة وفسّر دور الأكسجين في الاحتراق. أُعدم بالمقصلة أثناء الثورة.`],
    [`André-Marie Ampère`, `1775 – 1836`, `الكهرباء`, `Il a fondé l'électromagnétisme. L'unité d'intensité du courant électrique, l'ampère, porte son nom.`, `أسّس علم الكهرومغناطيسية. وتحمل وحدة شدة التيار الكهربائي «أمبير» اسمه.`],
    [`Jean-François Champollion`, `1790 – 1832`, `علم المصريات`, `Il a déchiffré les hiéroglyphes égyptiens en 1822, grâce à la pierre de Rosette. Il a ouvert les portes de l'Égypte ancienne.`, `فكّ رموز الهيروغليفية المصرية عام 1822 بفضل حجر رشيد، وفتح أبواب فهم مصر القديمة.`],
    [`Louis Braille`, `1809 – 1852`, `اختراع`, `Devenu aveugle à trois ans, il a inventé vers 1824 l'écriture en points pour les aveugles.`, `فقد بصره في الثالثة من عمره، واخترع نحو عام 1824 كتابة النقاط البارزة للمكفوفين.`],
    [`Louis Pasteur`, `1822 – 1895`, `الطب والأحياء`, `Il a créé le vaccin contre la rage (1885) et la pasteurisation. Il a prouvé le rôle des microbes dans les maladies.`, `ابتكر لقاح داء الكلب (1885) والبسترة. وأثبت دور الميكروبات في الأمراض.`],
    [`Marie Curie`, `1867 – 1934`, `الفيزياء والكيمياء`, `Née en Pologne, elle a vécu en France. Avec Pierre Curie, elle découvre le polonium et le radium. Elle reçoit deux prix Nobel (physique 1903, chimie 1911) : c'est la première femme à obtenir un Nobel.`, `وُلدت في بولندا وعاشت في فرنسا. اكتشفت مع بيير كوري البولونيوم والراديوم. نالت جائزتي نوبل (الفيزياء 1903 والكيمياء 1911)، وهي أول امرأة تنال نوبل.`],
    [`Françoise Barré-Sinoussi et Luc Montagnier`, `Nobel 2008`, `الطب`, `Ils ont découvert le virus du sida (VIH) en 1983 à l'Institut Pasteur de Paris.`, `اكتشفا فيروس الإيدز (HIV) عام 1983 في معهد باستور بباريس.`]
  ];
  // [الاختراع، السنة، المخترع، فرنسي، عربي، إيموجي]
  var INVENT = [
    [`La Pascaline`, `1642`, `Blaise Pascal`, `Une des premières machines à calculer mécaniques.`, `إحدى أولى الآلات الحاسبة الميكانيكية.`, `🧮`],
    [`La montgolfière`, `1783`, `Les frères Montgolfier`, `Le premier vol libre d'hommes dans un ballon à air chaud a lieu à Paris en 1783.`, `أول رحلة حرة للبشر في منطاد الهواء الساخن جرت في باريس عام 1783.`, `🎈`],
    [`Le système métrique`, `1795`, `La Révolution française`, `Le mètre et le kilogramme sont créés pour avoir des mesures égales pour tous.`, `ظهر المتر والكيلوغرام ليكون القياس واحداً للجميع.`, `📏`],
    [`La conserve alimentaire`, `1804`, `Nicolas Appert`, `Il conserve les aliments dans des bocaux chauffés.`, `حفظ الطعام في برطمانات مسخَّنة.`, `🥫`],
    [`Le stéthoscope`, `1816`, `René Laennec`, `Un instrument pour écouter le cœur et les poumons.`, `أداة للاستماع إلى القلب والرئتين.`, `🩺`],
    [`La photographie`, `1826`, `Nicéphore Niépce`, `La première photographie conservée date des années 1820. Daguerre invente le daguerréotype en 1839.`, `أقدم صورة فوتوغرافية محفوظة تعود إلى عشرينيات القرن التاسع عشر، واخترع داجير «الداجيروتايب» عام 1839.`, `📷`],
    [`Le cinématographe`, `1895`, `Les frères Lumière`, `La première projection publique payante a lieu à Paris le 28 décembre 1895.`, `أول عرض سينمائي عام مدفوع جرى في باريس يوم 28 ديسمبر 1895.`, `🎬`],
    [`Le scaphandre autonome`, `1943`, `Jacques Cousteau et Émile Gagnan`, `Il permet de plonger librement sous l'eau avec une bouteille d'air.`, `يتيح الغوص بحرية تحت الماء بأسطوانة هواء.`, `🤿`],
    [`Le stylo Bic Cristal`, `1950`, `Marcel Bich`, `Un stylo à bille simple et bon marché, vendu dans le monde entier.`, `قلم حبر جاف بسيط ورخيص يُباع في العالم كله.`, `🖊️`],
    [`Le TGV`, `1981`, `SNCF`, `Le train à grande vitesse relie Paris à Lyon en un peu plus de deux heures.`, `القطار فائق السرعة يربط باريس بليون في ساعتين تقريباً.`, `🚄`]
  ];

  // [السنة، العنوان، النوع(roi/chef/event)، فرنسي، عربي]
  var HIST = [
    [`52 av. J.-C.`, `Vercingétorix`, 'chef', `Chef gaulois, il perd la bataille d'Alésia contre Jules César. La Gaule devient romaine.`, `زعيم غالي، خسر معركة أليزيا أمام يوليوس قيصر، فصارت بلاد الغال رومانية.`],
    [`vers 496`, `Clovis`, 'roi', `Roi des Francs, il se fait baptiser et fonde le royaume franc, début de l'histoire de France.`, `ملك الفرنجة، تعمّد وأسّس المملكة الفرنجية، وهي بداية تاريخ فرنسا.`],
    [`800`, `Charlemagne`, 'roi', `Il est couronné empereur à Rome le jour de Noël. Il crée des écoles dans son empire.`, `توّج إمبراطوراً في روما يوم عيد الميلاد، وأنشأ مدارس في إمبراطوريته.`],
    [`987`, `Hugues Capet`, 'roi', `Il devient roi et fonde la dynastie des Capétiens, qui règne pendant des siècles.`, `صار ملكاً وأسّس سلالة الكابيتيين التي حكمت قروناً.`],
    [`1250`, `Saint Louis (Louis IX)`, 'roi', `Roi juste et pieux. Pendant la septième croisade, il est battu et capturé en Égypte, près de Mansourah.`, `ملك عادل وتقيّ. في الحملة الصليبية السابعة هُزم وأُسر في مصر قرب المنصورة.`],
    [`1429`, `Jeanne d'Arc`, 'chef', `Pendant la guerre de Cent Ans, elle libère Orléans. Elle est brûlée à Rouen en 1431.`, `خلال حرب المئة عام حرّرت أورليان، وأُحرقت في روان عام 1431.`],
    [`1515`, `François Ier`, 'roi', `Roi de la Renaissance. Il invite Léonard de Vinci en France et construit des châteaux sur la Loire.`, `ملك عصر النهضة. دعا ليوناردو دا فينشي إلى فرنسا وبنى قصوراً على نهر اللوار.`],
    [`1598`, `Henri IV`, 'roi', `Avec l'édit de Nantes, il met fin aux guerres de religion et accorde la tolérance aux protestants.`, `بمرسوم نانت أنهى الحروب الدينية ومنح البروتستانت حرية العقيدة.`],
    [`1643 – 1715`, `Louis XIV, le Roi-Soleil`, 'roi', `Il règne pendant 72 ans, le plus long règne d'Europe. Il construit le château de Versailles.`, `حكم 72 عاماً، وهو أطول حكم في أوروبا، وبنى قصر فرساي.`],
    [`1789`, `La Révolution française`, 'event', `Le 14 juillet, le peuple prend la Bastille. La Déclaration des droits de l'homme et du citoyen proclame la liberté et l'égalité.`, `في 14 يوليو اقتحم الشعب الباستيل. وأعلن إعلان حقوق الإنسان والمواطن الحرية والمساواة.`],
    [`1793`, `Fin de la monarchie`, 'event', `Le roi Louis XVI est guillotiné. La France devient une république.`, `أُعدم الملك لويس السادس عشر بالمقصلة، وأصبحت فرنسا جمهورية.`],
    [`1798 – 1801`, `Napoléon en Égypte`, 'chef', `Bonaparte conduit une expédition en Égypte avec des savants. La pierre de Rosette est découverte en 1799 et la «Description de l'Égypte» est publiée.`, `قاد بونابرت حملة إلى مصر ومعه علماء. اكتُشف حجر رشيد عام 1799، ونُشر كتاب «وصف مصر».`],
    [`1804 – 1815`, `Napoléon Ier`, 'chef', `Empereur des Français, il crée le Code civil (1804). Il est battu à Waterloo en 1815 et meurt en exil à Sainte-Hélène en 1821.`, `إمبراطور الفرنسيين، أصدر القانون المدني (1804). هُزم في واترلو عام 1815 ومات في المنفى بسانت هيلانة عام 1821.`],
    [`1852 – 1870`, `Napoléon III`, 'chef', `Empereur du Second Empire. Avec Haussmann, il transforme Paris : grands boulevards et jardins.`, `إمبراطور الإمبراطورية الثانية. غيّر باريس مع هوسمان: شوارع واسعة وحدائق.`],
    [`1869`, `Le canal de Suez`, 'event', `L'ingénieur français Ferdinand de Lesseps inaugure le canal de Suez en Égypte.`, `افتتح المهندس الفرنسي فرديناند دي ليسبس قناة السويس في مصر.`],
    [`1870 – 1940`, `La IIIe République`, 'event', `Le régime républicain s'installe. La tour Eiffel est construite pour l'Exposition universelle de 1889.`, `استقرّ النظام الجمهوري. وبُني برج إيفل لمعرض 1889 العالمي.`],
    [`1914 – 1918`, `La Première Guerre mondiale`, 'event', `La France combat l'Allemagne. La guerre se termine le 11 novembre 1918.`, `تحارب فرنسا ألمانيا، وتنتهي الحرب في 11 نوفمبر 1918.`],
    [`1940 – 1944`, `Charles de Gaulle`, 'chef', `Le 18 juin 1940, il lance de Londres un appel à la Résistance. Paris est libéré en août 1944.`, `في 18 يونيو 1940 وجّه من لندن نداءً للمقاومة. وتحررت باريس في أغسطس 1944.`],
    [`1958`, `La Ve République`, 'event', `De Gaulle écrit une nouvelle Constitution et devient président de 1959 à 1969.`, `وضع ديغول دستوراً جديداً وصار رئيساً من 1959 إلى 1969.`],
    [`1957 – 2002`, `La France et l'Europe`, 'event', `La France signe le traité de Rome en 1957. L'euro circule depuis 2002.`, `وقّعت فرنسا معاهدة روما عام 1957. ويتداول اليورو منذ 2002.`],
    [`1981`, `François Mitterrand`, 'chef', `Président de 1981 à 1995. En 1981, la France abolit la peine de mort.`, `رئيس من 1981 إلى 1995. وفي 1981 ألغت فرنسا عقوبة الإعدام.`],
    [`depuis 2017`, `Emmanuel Macron`, 'chef', `Président de la République depuis 2017, réélu en 2022.`, `رئيس الجمهورية منذ 2017، وأُعيد انتخابه عام 2022.`]
  ];

  // [الاسم، التواريخ، الفئة(mus/act/pei)، فرنسي، عربي، أعمال مشهورة]
  var ARTS = [
    [`Jean-Baptiste Lully`, `1632 – 1687`, 'mus', `Compositeur de la cour de Louis XIV. Il a créé l'opéra français.`, `مؤلف موسيقي في بلاط لويس الرابع عشر، وهو مؤسس الأوبرا الفرنسية.`, `Armide, Le Bourgeois gentilhomme`],
    [`Hector Berlioz`, `1803 – 1869`, 'mus', `Compositeur romantique, il a écrit une symphonie qui raconte une histoire.`, `مؤلف رومانسي كتب سيمفونية تحكي قصة.`, `Symphonie fantastique (1830)`],
    [`Georges Bizet`, `1838 – 1875`, 'mus', `Son opéra «Carmen» est l'un des plus joués du monde.`, `أوبراه «كارمن» من أكثر الأوبرات عرضاً في العالم.`, `Carmen (1875)`],
    [`Claude Debussy`, `1862 – 1918`, 'mus', `Maître de la musique impressionniste, douce et pleine de couleurs.`, `سيد الموسيقى الانطباعية، رقيقة وغنية بالألوان.`, `Clair de lune, La Mer`],
    [`Maurice Ravel`, `1875 – 1937`, 'mus', `Son célèbre «Boléro» répète la même mélodie en augmentant le volume.`, `مقطوعته الشهيرة «بوليرو» تكرر اللحن نفسه مع رفع الصوت تدريجياً.`, `Boléro (1928)`],
    [`Édith Piaf`, `1915 – 1963`, 'mus', `La plus célèbre chanteuse française, surnommée «la Môme». Sa voix puissante a touché le monde entier.`, `أشهر مغنية فرنسية، لُقّبت بـ«لا موم». وصل صوتها القوي إلى العالم كله.`, `La Vie en rose, Non, je ne regrette rien`],
    [`Charles Aznavour`, `1924 – 2018`, 'mus', `Chanteur et auteur d'origine arménienne, il a écrit plus de mille chansons.`, `مغنٍّ وكاتب من أصل أرمني، ألّف أكثر من ألف أغنية.`, `La Bohème, Hier encore`],
    [`Dalida`, `1933 – 1987`, 'mus', `Née au Caire dans une famille d'origine italienne, elle est devenue une star en France. Elle chantait en plusieurs langues, dont l'arabe.`, `وُلدت في القاهرة لأسرة من أصل إيطالي وأصبحت نجمة في فرنسا. غنّت بعدة لغات منها العربية.`, `Paroles, paroles… ; Salma ya salama`],
    [`Daft Punk`, `1993 – 2021`, 'mus', `Duo de musique électronique, célèbre pour ses casques de robot.`, `ثنائي موسيقى إلكترونية اشتهر بخوذات الروبوت.`, `Get Lucky (2013)`],
    [`Jean Gabin`, `1904 – 1976`, 'act', `Grand acteur du cinéma français classique.`, `ممثل كبير في السينما الفرنسية الكلاسيكية.`, `La Grande Illusion (1937)`],
    [`Louis de Funès`, `1914 – 1983`, 'act', `Roi de la comédie : ses grimaces et son énergie font rire toute la famille.`, `ملك الكوميديا: تعابير وجهه وحيويته تضحك العائلة كلها.`, `Le Gendarme de Saint-Tropez, La Grande Vadrouille`],
    [`Alain Delon`, `1935 – 2024`, 'act', `Séducteur et star internationale du cinéma des années 1960.`, `نجم عالمي أسر القلوب في سينما الستينيات.`, `Plein soleil, Le Samouraï`],
    [`Catherine Deneuve`, `née en 1943`, 'act', `Actrice élégante, l'un des visages les plus célèbres du cinéma français.`, `ممثلة أنيقة، وأحد أشهر وجوه السينما الفرنسية.`, `Les Parapluies de Cherbourg (1964)`],
    [`Marion Cotillard`, `née en 1975`, 'act', `Elle a reçu l'Oscar de la meilleure actrice en 2008 pour son rôle d'Édith Piaf.`, `نالت أوسكار أفضل ممثلة عام 2008 عن دور إديث بياف.`, `La Môme (La Vie en rose)`],
    [`Jean Dujardin`, `né en 1972`, 'act', `Il a reçu l'Oscar du meilleur acteur en 2012 pour un film muet en noir et blanc.`, `نال أوسكار أفضل ممثل عام 2012 عن فيلم صامت بالأبيض والأسود.`, `The Artist (2011)`],
    [`Omar Sy`, `né en 1978`, 'act', `Acteur au grand sourire, il a reçu le César du meilleur acteur en 2012.`, `ممثل بابتسامة واسعة، نال جائزة سيزار لأفضل ممثل عام 2012.`, `Intouchables (2011)`],
    [`Jacques-Louis David`, `1748 – 1825`, 'pei', `Peintre de la Révolution et de Napoléon, maître du style néoclassique.`, `رسام الثورة ونابليون، وسيد الأسلوب الكلاسيكي الجديد.`, `Le Sacre de Napoléon, La Mort de Marat`],
    [`Eugène Delacroix`, `1798 – 1863`, 'pei', `Grand peintre romantique, il aimait les couleurs fortes et le mouvement.`, `رسام رومانسي كبير أحب الألوان القوية والحركة.`, `La Liberté guidant le peuple (1830)`],
    [`Édouard Manet`, `1832 – 1883`, 'pei', `Il ouvre la voie à la peinture moderne.`, `مهّد الطريق للرسم الحديث.`, `Le Déjeuner sur l'herbe (1863)`],
    [`Claude Monet`, `1840 – 1926`, 'pei', `Fondateur de l'impressionnisme. Le nom du mouvement vient de son tableau «Impression, soleil levant».`, `مؤسس الانطباعية. اسم المدرسة مأخوذ من لوحته «انطباع، شروق الشمس».`, `Impression, soleil levant (1872), Les Nymphéas`],
    [`Auguste Renoir`, `1841 – 1919`, 'pei', `Peintre de la joie de vivre, des fêtes, de la lumière et des visages.`, `رسام البهجة والحفلات والضوء والوجوه.`, `Bal du moulin de la Galette (1876)`],
    [`Paul Cézanne`, `1839 – 1906`, 'pei', `Il construit ses tableaux avec des formes simples. Il a inspiré l'art du XXe siècle.`, `بنى لوحاته بأشكال بسيطة، وألهم فنّ القرن العشرين.`, `Les Joueurs de cartes`],
    [`Auguste Rodin`, `1840 – 1917`, 'pei', `Le plus célèbre sculpteur français. Ses statues montrent la force des émotions.`, `أشهر نحّات فرنسي. تُظهر تماثيله قوة المشاعر.`, `Le Penseur, Le Baiser`],
    [`Henri Matisse`, `1869 – 1954`, 'pei', `Chef du fauvisme : couleurs pures et formes simples.`, `زعيم الوحشية (الفوفية): ألوان نقية وأشكال بسيطة.`, `La Danse`]
  ];

  // [سؤال فرنسي، ترجمة، [الإجابة الصحيحة أولاً + 3 خاطئة]، شرح عربي]
  var QUIZ = [
    [`Qui a écrit «Les Misérables» ?`, `من كتب «البؤساء»؟`, [`Victor Hugo`, `Balzac`, `Zola`, `Flaubert`], `فيكتور هوغو هو مؤلف «البؤساء» و«أحدب نوتردام».`],
    [`Qui est l'auteur du «Petit Prince» ?`, `من مؤلف «الأمير الصغير»؟`, [`Saint-Exupéry`, `Camus`, `Jules Verne`, `Proust`], `ألّفه الطيّار سان إكزوبيري عام 1943.`],
    [`Quel poète a écrit des «Fables» avec des animaux ?`, `أي شاعر كتب «خرافات» بحيوانات؟`, [`La Fontaine`, `Molière`, `Racine`, `Ronsard`], `لافونتين صاحب «الغراب والثعلب».`],
    [`«Tartuffe» et «L'Avare» sont des pièces de…`, `«طرطوف» و«البخيل» مسرحيتان لـ…`, [`Molière`, `Racine`, `Voltaire`, `Hugo`], `مولير هو سيد الكوميديا الفرنسية.`],
    [`Quel écrivain a reçu le prix Nobel de littérature en 1957 ?`, `من نال نوبل للآداب عام 1957؟`, [`Albert Camus`, `Marcel Proust`, `Émile Zola`, `Voltaire`], `ألبير كامو (صاحب «الغريب»). أما سارتر فرفض نوبل عام 1964.`],
    [`Qui a écrit «Le Tour du monde en quatre-vingts jours» ?`, `من كتب «حول العالم في ثمانين يوماً»؟`, [`Jules Verne`, `Alexandre Dumas`, `Balzac`, `Molière`], `جول فيرن أبو الخيال العلمي.`],
    [`Quel poète a écrit «Les Fleurs du mal» ?`, `أي شاعر كتب «أزهار الشر»؟`, [`Baudelaire`, `Apollinaire`, `Ronsard`, `Villon`], `بودلير 1857.`],
    [`Qui a reçu le prix Nobel de littérature en 2022 ?`, `من نالت نوبل للآداب عام 2022؟`, [`Annie Ernaux`, `Leïla Slimani`, `Modiano`, `Le Clézio`], `آني إرنو.`],
    [`Qui a écrit «J'accuse…!» pour défendre Dreyfus ?`, `من كتب «إني أتهم…!» دفاعاً عن دريفوس؟`, [`Émile Zola`, `Victor Hugo`, `Voltaire`, `Camus`], `إميل زولا عام 1898.`],
    [`Qui a écrit «Candide» ?`, `من كتب «كانديد»؟`, [`Voltaire`, `Rousseau`, `Molière`, `Racine`], `فولتير، فيلسوف التنوير.`],
    [`Qui a dit « Je pense, donc je suis » ?`, `من قال «أنا أفكر إذن أنا موجود»؟`, [`Descartes`, `Pascal`, `Voltaire`, `Rousseau`], `ديكارت.`],
    [`Qui a déchiffré les hiéroglyphes en 1822 ?`, `من فكّ رموز الهيروغليفية عام 1822؟`, [`Champollion`, `Pasteur`, `Lavoisier`, `Braille`], `شامبوليون بفضل حجر رشيد.`],
    [`Qui a inventé le vaccin contre la rage ?`, `من اخترع لقاح داء الكلب؟`, [`Louis Pasteur`, `Marie Curie`, `Ampère`, `Laennec`], `باستور عام 1885.`],
    [`Combien de prix Nobel Marie Curie a-t-elle reçus ?`, `كم جائزة نوبل نالت ماري كوري؟`, [`Deux`, `Un`, `Trois`, `Aucun`], `جائزتان: الفيزياء 1903 والكيمياء 1911.`],
    [`Qui a inventé l'écriture pour les aveugles ?`, `من اخترع الكتابة للمكفوفين؟`, [`Louis Braille`, `Louis Pasteur`, `Pascal`, `Ampère`], `لويس برايل.`],
    [`Que les frères Lumière ont-ils inventé ?`, `ماذا اخترع الأخوان لوميير؟`, [`Le cinématographe`, `Le téléphone`, `Le stéthoscope`, `Le TGV`], `أول عرض سينمائي عام في 28 ديسمبر 1895.`],
    [`Qui a inventé la machine à calculer «Pascaline» ?`, `من اخترع آلة «الباسكالين» الحاسبة؟`, [`Blaise Pascal`, `Descartes`, `Lavoisier`, `Montgolfier`], `باسكال وهو في التاسعة عشرة.`],
    [`Qui est le père de la chimie moderne ?`, `من هو أبو الكيمياء الحديثة؟`, [`Lavoisier`, `Pasteur`, `Becquerel`, `Foucault`], `لافوازييه.`],
    [`Quel système de mesure est né pendant la Révolution française ?`, `أي نظام قياس وُلد أثناء الثورة الفرنسية؟`, [`Le système métrique`, `Le système impérial`, `Le calendrier romain`, `Le système solaire`], `المتر والكيلوغرام.`],
    [`En quelle année a lieu la prise de la Bastille ?`, `في أي سنة اقتُحم الباستيل؟`, [`1789`, `1799`, `1815`, `1870`], `14 يوليو 1789.`],
    [`Qui est surnommé le «Roi-Soleil» ?`, `من يُلقّب بـ«الملك الشمس»؟`, [`Louis XIV`, `Louis XVI`, `Henri IV`, `Napoléon`], `لويس الرابع عشر وقصر فرساي.`],
    [`Qui a conduit l'expédition française en Égypte en 1798 ?`, `من قاد الحملة الفرنسية على مصر عام 1798؟`, [`Napoléon Bonaparte`, `Louis XIV`, `De Gaulle`, `Charlemagne`], `نابليون بونابرت.`],
    [`Qui était Vercingétorix ?`, `من كان فرسنجتوريكس؟`, [`Un chef gaulois`, `Un roi franc`, `Un empereur romain`, `Un peintre`], `زعيم غالي هُزم في أليزيا أمام قيصر.`],
    [`Qui a lancé l'appel du 18 juin 1940 ?`, `من وجّه نداء 18 يونيو 1940؟`, [`Charles de Gaulle`, `Mitterrand`, `Napoléon III`, `Clemenceau`], `ديغول من لندن.`],
    [`En quelle année naît la Ve République ?`, `في أي سنة وُلدت الجمهورية الخامسة؟`, [`1958`, `1789`, `1946`, `1981`], `عام 1958.`],
    [`Qui a fait inaugurer le canal de Suez en 1869 ?`, `من افتتح قناة السويس عام 1869؟`, [`Ferdinand de Lesseps`, `Haussmann`, `Gustave Eiffel`, `Napoléon Ier`], `فرديناند دي ليسبس.`],
    [`Qui a libéré Orléans en 1429 ?`, `من حرّرت أورليان عام 1429؟`, [`Jeanne d'Arc`, `Marie-Antoinette`, `Catherine de Médicis`, `Marie Curie`], `جان دارك.`],
    [`Qui a été couronné empereur en l'an 800 ?`, `من توّج إمبراطوراً عام 800؟`, [`Charlemagne`, `Clovis`, `Hugues Capet`, `Saint Louis`], `شارلمان.`],
    [`Quand la Tour Eiffel a-t-elle été construite ?`, `متى بُني برج إيفل؟`, [`1889`, `1789`, `1900`, `1925`], `لمعرض باريس العالمي 1889.`],
    [`Qui a peint «La Liberté guidant le peuple» ?`, `من رسم «الحرية تقود الشعب»؟`, [`Delacroix`, `Monet`, `Renoir`, `Cézanne`], `ديلاكروا عام 1830.`],
    [`Quel peintre a donné son nom à l'impressionnisme avec «Impression, soleil levant» ?`, `أي رسام أعطى اسم الانطباعية بلوحة «انطباع، شروق الشمس»؟`, [`Claude Monet`, `Manet`, `Degas`, `Matisse`], `كلود مونيه 1872.`],
    [`Qui a sculpté «Le Penseur» ?`, `من نحت «المفكّر»؟`, [`Rodin`, `Matisse`, `Delacroix`, `Manet`], `أوغست رودان.`],
    [`Qui chante «La Vie en rose» ?`, `من تغنّي «الحياة بالوردي»؟`, [`Édith Piaf`, `Dalida`, `Aznavour`, `Brel`], `إديث بياف.`],
    [`Quelle chanteuse née au Caire a chanté «Salma ya salama» ?`, `أي مغنية وُلدت في القاهرة غنّت «سلمى يا سلامة»؟`, [`Dalida`, `Édith Piaf`, `Barbara`, `Zaz`], `داليدا.`],
    [`Qui a composé le «Boléro» ?`, `من ألّف «بوليرو»؟`, [`Maurice Ravel`, `Debussy`, `Bizet`, `Berlioz`], `موريس رافيل 1928.`],
    [`Qui a composé l'opéra «Carmen» ?`, `من ألّف أوبرا «كارمن»؟`, [`Georges Bizet`, `Lully`, `Ravel`, `Debussy`], `جورج بيزيه 1875.`],
    [`Quel acteur joue dans «Intouchables» ?`, `أي ممثل شارك في فيلم «أصدقاء لا يُمَسّون»؟`, [`Omar Sy`, `Jean Gabin`, `Alain Delon`, `Louis de Funès`], `عمر سي، وفاز بجائزة سيزار عام 2012.`],
    [`Quelle actrice a reçu l'Oscar en 2008 pour «La Môme» ?`, `أي ممثلة نالت الأوسكار عام 2008 عن «لا موم»؟`, [`Marion Cotillard`, `Catherine Deneuve`, `Juliette Binoche`, `Brigitte Bardot`], `ماريون كوتيار في دور إديث بياف.`],
    [`Dans quel musée de Paris est exposée la Joconde ?`, `في أي متحف بباريس تُعرض الموناليزا؟`, [`Le Louvre`, `Le musée d'Orsay`, `Versailles`, `Le Centre Pompidou`], `متحف اللوفر.`],
    [`Qui est président de la France depuis 2017 ?`, `من رئيس فرنسا منذ 2017؟`, [`Emmanuel Macron`, `François Hollande`, `Nicolas Sarkozy`, `Jacques Chirac`], `إيمانويل ماكرون، أُعيد انتخابه عام 2022.`]
  ];

  /* ====================== الأنماط ====================== */
  var css = `
  .lt-root{direction:rtl;font-family:inherit;margin:6px 0 18px;color:#12233f}
  .lt-root *{box-sizing:border-box}
  .lt-banner{border-radius:20px;padding:16px 14px;color:#fff;text-align:center;background:linear-gradient(135deg,#0b57a4,#0a3a78);position:relative;overflow:hidden;box-shadow:0 8px 22px rgba(0,60,140,.22)}
  .lt-banner:after{content:"";position:absolute;left:0;right:0;bottom:0;height:6px;background:linear-gradient(90deg,#0b57a4 33%,#fff 33% 66%,#e53935 66%)}
  .lt-banner h2{margin:0 0 4px;font-size:20px}
  .lt-banner p{margin:0;font-size:13px;opacity:.9}
  .lt-nav{display:flex;gap:7px;overflow-x:auto;padding:12px 2px 6px;position:sticky;top:0;z-index:5;background:linear-gradient(#f0f4fb 75%,rgba(240,244,251,0));scrollbar-width:none}
  .lt-nav::-webkit-scrollbar{display:none}
  .lt-pill{flex:none;border:1.5px solid #c9d6ec;background:#fff;color:#0b4a9a;border-radius:22px;padding:9px 15px;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;white-space:nowrap}
  .lt-pill.on{background:#0b57a4;color:#fff;border-color:#0b57a4;box-shadow:0 4px 12px rgba(11,87,164,.3)}
  .lt-sub{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
  .lt-chip{border:1.5px solid #cfd9ea;background:#fff;color:#334e75;border-radius:16px;padding:5px 12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
  .lt-chip.on{background:#25b760;border-color:#25b760;color:#fff}
  .lt-h{font-size:17px;font-weight:800;margin:16px 4px 8px;color:#0b4a9a;border-right:5px solid #e53935;padding-right:9px}
  .lt-card{background:#fff;border:1px solid #dfe7f3;border-radius:18px;padding:13px 14px;margin:10px 0;box-shadow:0 3px 12px rgba(0,40,100,.06);position:relative;overflow:hidden;animation:ltIn .35s ease}
  .lt-card:before{content:"";position:absolute;top:0;right:0;left:0;height:4px;background:linear-gradient(90deg,#0b57a4 33%,#25b760 33% 66%,#e53935 66%)}
  @keyframes ltIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .lt-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px}
  .lt-name{font-weight:800;font-size:16.5px;direction:ltr;text-align:left}
  .lt-tag{font-size:12px;background:#eaf1fb;color:#0b4a9a;border-radius:10px;padding:2px 9px;font-weight:700;direction:ltr}
  .lt-tag.g{background:#e3f7ec;color:#17803f}.lt-tag.r{background:#fde8e8;color:#b3261e}
  .lt-fr{direction:ltr;text-align:left;font-size:15.5px;line-height:1.75;margin-top:8px;font-weight:500}
  .lt-ar{direction:rtl;text-align:right;font-size:14.5px;line-height:1.85;color:#42536e;margin-top:6px;padding-top:6px;border-top:1px dashed #d6dfef}
  .lt-q{direction:ltr;text-align:left;margin-top:8px;background:#fff8e6;border-right:0;border-left:4px solid #f5b301;border-radius:10px;padding:7px 10px;font-style:italic;font-size:15px}
  .lt-q small{display:block;direction:rtl;text-align:right;font-style:normal;color:#6b5a1f;margin-top:3px}
  .lt-say{border:0;background:#eaf1fb;color:#0b4a9a;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;flex:none;vertical-align:middle;margin-inline-start:6px}
  .lt-say.slow{font-size:14px}
  .lt-say.play{background:#25b760;color:#fff}
  .lt-line{display:flex;gap:4px;align-items:flex-start;direction:ltr}
  .lt-line>div{flex:1}
  .lt-works{margin-top:7px;direction:ltr;text-align:left;font-size:13.5px;color:#6b4bd6;font-weight:700}
  .lt-emoji{font-size:30px;margin-inline-end:4px}
  .lt-tl{position:relative;margin-right:14px;padding-right:18px;border-right:3px solid #c9d6ec}
  .lt-tl .lt-card{margin-right:0}
  .lt-tl .lt-card:after{content:"";position:absolute;right:-31px;top:20px;width:14px;height:14px;border-radius:50%;background:#e53935;border:3px solid #fff;box-shadow:0 0 0 2px #0b57a4}
  .lt-prog{height:10px;background:#e0e7f3;border-radius:6px;overflow:hidden;margin:6px 0 12px}
  .lt-prog i{display:block;height:100%;background:linear-gradient(90deg,#0b57a4,#25b760);width:0;transition:width .4s}
  .lt-qn{font-size:13px;color:#5b6b85;font-weight:700;display:flex;justify-content:space-between}
  .lt-opt{display:block;width:100%;text-align:left;direction:ltr;background:#fff;border:2px solid #cfd9ea;border-radius:14px;padding:12px 14px;margin:8px 0;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;color:#12233f}
  .lt-opt:active{transform:scale(.985)}
  .lt-opt.ok{background:#dff6e8;border-color:#25b760;color:#126b34}
  .lt-opt.no{background:#fde7e7;border-color:#e53935;color:#a3201a}
  .lt-opt[disabled]{cursor:default}
  .lt-exp{margin-top:8px;background:#f1f6ff;border-radius:12px;padding:9px 12px;font-size:14px;color:#2b3f61}
  .lt-btn{border:0;background:#0b57a4;color:#fff;border-radius:14px;padding:12px 20px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;margin:6px 4px 0 0}
  .lt-btn.g{background:#25b760}.lt-btn.o{background:#fff;color:#0b57a4;border:2px solid #0b57a4}
  .lt-score{text-align:center;padding:10px 0}
  .lt-big{font-size:54px;font-weight:900;color:#0b57a4;line-height:1.1}
  .lt-wrong{background:#fff5f5;border:1px solid #f6caca;border-radius:12px;padding:8px 11px;margin:7px 0;font-size:14px}
  .lt-wrong b{direction:ltr;display:inline-block}
  `;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ====================== أدوات ====================== */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var frVoice = null, playingBtn = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var vs = speechSynthesis.getVoices().filter(function (v) { return /^fr/i.test(v.lang); });
    frVoice = vs.find(function (v) { return /google|female|amelie|marie/i.test(v.name); }) || vs[0] || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text, rate, btn) {
    if (!window.speechSynthesis) { alert('متصفحك لا يدعم النطق الصوتي'); return; }
    var same = playingBtn === btn && speechSynthesis.speaking;
    speechSynthesis.cancel();
    if (playingBtn) playingBtn.classList.remove('play');
    playingBtn = null;
    if (same) return;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR'; if (frVoice) u.voice = frVoice; u.rate = rate || 0.9;
    if (btn) { btn.classList.add('play'); playingBtn = btn; }
    u.onend = u.onerror = function () { if (btn) btn.classList.remove('play'); if (playingBtn === btn) playingBtn = null; };
    speechSynthesis.speak(u);
  }
  function sayBtns(text) {
    return '<button class="lt-say" data-say="' + esc(text) + '" title="استمع">🔊</button><button class="lt-say slow" data-say="' + esc(text) + '" data-rate="0.6" title="ببطء">🐢</button>';
  }
  function frBlock(text, cls) {
    return '<div class="lt-line"><div class="lt-fr ' + (cls || '') + '">' + esc(text) + '</div><div style="display:flex;flex-direction:column;gap:4px">' + sayBtns(text) + '</div></div>';
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ====================== العرض ====================== */
  var state = { tab: 'lit', litF: 'all', artF: 'mus', sciF: 'sav', quiz: null };
  var root = null, body = null;

  function viewLit() {
    var h = '<div class="lt-h">📖 نصوص أدبية مختصرة</div>';
    TEXTS.forEach(function (t) {
      h += '<div class="lt-card"><div class="lt-name">' + esc(t[0]) + '</div>' + frBlock(t[1]) + '<div class="lt-ar">' + esc(t[2]) + '</div></div>';
    });
    h += '<div class="lt-h">✍️ أشهر الأدباء والشعراء</div><div class="lt-sub">' +
      [['all', 'الكل'], ['old', 'القدماء 🏛️'], ['new', 'المعاصرون 🌟']].map(function (f) { return '<button class="lt-chip ' + (state.litF === f[0] ? 'on' : '') + '" data-litf="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>';
    LIT.filter(function (x) { return state.litF === 'all' || x[2] === state.litF; }).forEach(function (x) {
      h += '<div class="lt-card"><div class="lt-top"><div class="lt-name">' + esc(x[0]) + '</div><span class="lt-tag ' + (x[2] === 'old' ? 'r' : 'g') + '">' + esc(x[1]) + '</span></div>' + frBlock(x[3]) + '<div class="lt-ar">' + esc(x[4]) + '</div>';
      if (x[5]) h += '<div class="lt-q"><div class="lt-line"><div>« ' + esc(x[5]) + ' »</div>' + sayBtns(x[5]) + '</div><small>' + esc(x[6]) + '</small></div>';
      h += '</div>';
    });
    return h;
  }
  function viewSci() {
    var h = '<div class="lt-sub"><button class="lt-chip ' + (state.sciF === 'sav' ? 'on' : '') + '" data-scif="sav">🔬 العلماء</button><button class="lt-chip ' + (state.sciF === 'inv' ? 'on' : '') + '" data-scif="inv">💡 الاختراعات</button></div>';
    if (state.sciF === 'sav') {
      SAVANTS.forEach(function (x) {
        h += '<div class="lt-card"><div class="lt-top"><div class="lt-name">' + esc(x[0]) + '</div><span class="lt-tag">' + esc(x[1]) + '</span></div><span class="lt-tag g" style="display:inline-block;margin-top:6px">' + esc(x[2]) + '</span>' + frBlock(x[3]) + '<div class="lt-ar">' + esc(x[4]) + '</div></div>';
      });
    } else {
      INVENT.forEach(function (x) {
        h += '<div class="lt-card"><div class="lt-top"><div class="lt-name"><span class="lt-emoji">' + x[5] + '</span>' + esc(x[0]) + '</div><span class="lt-tag r">' + esc(x[1]) + '</span></div><div class="lt-works">👤 ' + esc(x[2]) + '</div>' + frBlock(x[3]) + '<div class="lt-ar">' + esc(x[4]) + '</div></div>';
      });
    }
    return h;
  }
  function viewHis() {
    var h = '<div class="lt-h">🏰 رحلة عبر تاريخ فرنسا (من القديم إلى اليوم)</div><div class="lt-tl">';
    HIST.forEach(function (x) {
      var tag = x[2] === 'roi' ? '👑 ملك' : x[2] === 'chef' ? '⭐ قائد/حاكم' : '📅 حدث';
      h += '<div class="lt-card"><div class="lt-top"><div class="lt-name">' + esc(x[1]) + '</div><span class="lt-tag r">' + esc(x[0]) + '</span></div><span class="lt-tag g" style="display:inline-block;margin-top:6px">' + tag + '</span>' + frBlock(x[3]) + '<div class="lt-ar">' + esc(x[4]) + '</div></div>';
    });
    return h + '</div>';
  }
  function viewArt() {
    var h = '<div class="lt-sub">' + [['mus', '🎵 الموسيقيون'], ['act', '🎬 الممثلون'], ['pei', '🎨 الرسامون والنحاتون']].map(function (f) {
      return '<button class="lt-chip ' + (state.artF === f[0] ? 'on' : '') + '" data-artf="' + f[0] + '">' + f[1] + '</button>';
    }).join('') + '</div>';
    ARTS.filter(function (x) { return x[2] === state.artF; }).forEach(function (x) {
      h += '<div class="lt-card"><div class="lt-top"><div class="lt-name">' + esc(x[0]) + '</div><span class="lt-tag">' + esc(x[1]) + '</span></div>' + frBlock(x[3]) + '<div class="lt-ar">' + esc(x[4]) + '</div><div class="lt-works">⭐ ' + esc(x[5]) + '</div></div>';
    });
    if (state.artF === 'pei') h += '<div class="lt-card"><div class="lt-name">Le musée du Louvre</div>' + frBlock(`Le Louvre, à Paris, est l'un des plus grands musées du monde. On y voit la Joconde de Léonard de Vinci.`) + '<div class="lt-ar">متحف اللوفر في باريس من أكبر متاحف العالم، وفيه لوحة الموناليزا (الجوكوندا) لليوناردو دا فينشي.</div></div>';
    return h;
  }

  /* ---------- الاختبار ---------- */
  function viewQuiz() {
    var q = state.quiz;
    var best = 0; try { best = +localStorage.getItem('lt_best') || 0; } catch (e) {}
    if (!q) {
      return '<div class="lt-card"><div class="lt-name" style="direction:rtl;text-align:right">🏆 اختبر نفسك</div><div class="lt-ar" style="border:0">اختبار تفاعلي يغطي كل ما درسته: الأدب والعلماء والاختراعات والتاريخ والفنون. تظهر النتيجة فور كل إجابة، وفي النهاية تقييم شامل ومراجعة لأخطائك.</div>' +
        (best ? '<div class="lt-ar" style="border:0">🥇 أفضل نتيجة لك: <b>' + best + '%</b></div>' : '') +
        '<button class="lt-btn g" data-start="10">⚡ اختبار سريع (10 أسئلة)</button><button class="lt-btn" data-start="20">📝 متوسط (20 سؤالاً)</button><button class="lt-btn o" data-start="' + QUIZ.length + '">🎓 الاختبار الشامل (' + QUIZ.length + ' سؤالاً)</button></div>';
    }
    if (q.done) {
      var pct = Math.round(q.score / q.list.length * 100);
      var msg = pct >= 90 ? '🏆 ممتاز! أنت موسوعة فرنسية حقيقية!' : pct >= 70 ? '👏 جيد جداً! استمر في التقدم' : pct >= 50 ? '💪 جيد، راجع الأخطاء وأعد المحاولة' : '📚 لا تقلق، راجع الدروس وجرّب مرة أخرى';
      try { if (pct > best) localStorage.setItem('lt_best', pct); } catch (e) {}
      var h = '<div class="lt-card"><div class="lt-score"><div class="lt-big">' + pct + '%</div><div><b>' + q.score + '</b> من <b>' + q.list.length + '</b> إجابة صحيحة</div><div style="margin-top:8px;font-weight:800">' + msg + '</div></div>';
      if (q.wrong.length) { h += '<div class="lt-h">🔍 راجع أخطاءك</div>' + q.wrong.map(function (w) { return '<div class="lt-wrong"><b>' + esc(w.q[0]) + '</b><br>' + esc(w.q[1]) + '<br>✅ <b>' + esc(w.q[2][0]) + '</b> — ' + esc(w.q[3]) + '</div>'; }).join(''); }
      return h + '<button class="lt-btn g" data-start="' + q.list.length + '">🔁 أعد الاختبار</button><button class="lt-btn o" data-menu="1">القائمة</button></div>';
    }
    var cur = q.list[q.i], opts = q.opts;
    var h2 = '<div class="lt-qn"><span>السؤال ' + (q.i + 1) + ' / ' + q.list.length + '</span><span>✅ ' + q.score + '</span></div><div class="lt-prog"><i style="width:' + (q.i / q.list.length * 100) + '%"></i></div>' +
      '<div class="lt-card">' + frBlock(cur[0], 'q') + '<div class="lt-ar">' + esc(cur[1]) + '</div>';
    opts.forEach(function (o, k) {
      var cls = '';
      if (q.answered != null) { if (o === cur[2][0]) cls = 'ok'; else if (k === q.answered) cls = 'no'; }
      h2 += '<button class="lt-opt ' + cls + '" data-opt="' + k + '"' + (q.answered != null ? ' disabled' : '') + '>' + esc(o) + '</button>';
    });
    if (q.answered != null) {
      var good = opts[q.answered] === cur[2][0];
      h2 += '<div class="lt-exp">' + (good ? '🎉 <b>إجابة صحيحة!</b> ' : '❌ <b>إجابة خاطئة.</b> الصحيح: <b dir="ltr">' + esc(cur[2][0]) + '</b>. ') + esc(cur[3]) + '</div>' +
        '<button class="lt-btn" data-next="1">' + (q.i + 1 === q.list.length ? '🏁 عرض النتيجة' : 'السؤال التالي ➡️') + '</button>';
    }
    return h2 + '</div>';
  }
  function startQuiz(n) {
    var list = shuffle(QUIZ).slice(0, n);
    state.quiz = { list: list, i: 0, score: 0, wrong: [], answered: null, done: false, opts: shuffle(list[0][2]) };
  }

  var VIEWS = { lit: viewLit, sci: viewSci, his: viewHis, art: viewArt, quiz: viewQuiz };
  function render(keepScroll) {
    if (window.speechSynthesis) speechSynthesis.cancel();
    root.querySelectorAll('.lt-pill').forEach(function (p) { p.classList.toggle('on', p.dataset.tab === state.tab); });
    body.innerHTML = VIEWS[state.tab]();
    if (!keepScroll) { var top = root.querySelector('.lt-nav'); if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start' }); }
  }

  function build() {
    root = document.createElement('div'); root.id = 'lt-root'; root.className = 'lt-root';
    root.innerHTML = '<div class="lt-banner"><h2>📚 الأدب الفرنسي العالمي والمكتبة الثقافية</h2><p>أدباء • علماء • تاريخ • فنون — بالفرنسية مع الترجمة والنطق 🔊</p></div>' +
      '<div class="lt-nav">' + [['lit', '📜 الأدب'], ['sci', '🔬 العلماء والاختراعات'], ['his', '🏰 التاريخ والحكام'], ['art', '🎭 الفنون'], ['quiz', '🏆 الاختبار']].map(function (t) {
        return '<button class="lt-pill" data-tab="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div><div class="lt-body"></div>';
    body = root.querySelector('.lt-body');
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var d = b.dataset;
      if (d.say) return speak(d.say, d.rate ? parseFloat(d.rate) : 0.9, b);
      if (d.tab) { state.tab = d.tab; return render(); }
      if (d.litf) { state.litF = d.litf; return render(true); }
      if (d.scif) { state.sciF = d.scif; return render(true); }
      if (d.artf) { state.artF = d.artf; return render(true); }
      if (d.start) { startQuiz(+d.start); return render(); }
      if (d.menu) { state.quiz = null; return render(); }
      var q = state.quiz;
      if (d.opt != null && q && q.answered == null) {
        q.answered = +d.opt; var cur = q.list[q.i];
        if (q.opts[q.answered] === cur[2][0]) q.score++; else q.wrong.push({ q: cur });
        return render(true);
      }
      if (d.next && q) {
        q.i++; q.answered = null;
        if (q.i >= q.list.length) q.done = true; else q.opts = shuffle(q.list[q.i][2]);
        return render();
      }
    });
    render(true);
  }

  /* ====================== التركيب في التبويب ====================== */
  var RE_TITLE = /litt[ée]rature\s+fran[çc]aise/i;
  function mount() {
    var host = document.getElementById('lit-root');
    if (host) {
      if (!root) build();
      if (root.parentElement !== host) { host.innerHTML = ''; host.appendChild(root); }
      return;
    }
    var nodes = document.querySelectorAll('h1,h2,h3,h4,div,span,p');
    var title = null;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.children.length === 0 && n.textContent.length < 60 && RE_TITLE.test(n.textContent) && !(root && root.contains(n))) { title = n; break; }
    }
    if (!title) { if (root && !root.isConnected && window.speechSynthesis) speechSynthesis.cancel(); return; }
    if (!root) build();
    if (root.isConnected && title.parentElement && title.parentElement.contains(root)) return;
    var anc = title.parentElement, card = null;
    while (anc && anc !== document.body) {
      var ph = Array.prototype.find.call(anc.querySelectorAll('*'), function (x) { return x.children.length === 0 && /قيد الإعداد/.test(x.textContent) && !root.contains(x); });
      if (ph) {
        var c = ph; while (c.parentElement && c.parentElement !== anc && !c.parentElement.contains(title)) c = c.parentElement;
        card = c; break;
      }
      anc = anc.parentElement;
    }
    if (card && card !== root) card.replaceWith(root);
    else if (!root.isConnected) title.parentElement.insertAdjacentElement('afterend', root);
  }
  var timer = null;
  new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(mount, 80); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', function () { setTimeout(mount, 150); setTimeout(mount, 500); }, true);
  if (document.readyState !== 'loading') mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
