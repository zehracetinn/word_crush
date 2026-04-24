# Word Crush Mobil Oyunu

Kocaeli Üniversitesi Bilgisayar Mühendisliği Bölümü  
Yazılım Laboratuvarı-II dersi kapsamında geliştirilen mobil kelime oyunu projesidir.

---

## Proje Amacı

Bu projede amaç, oyuncunun grid üzerinde bulunan harfleri kullanarak anlamlı kelimeler oluşturduğu bir mobil oyun geliştirmektir.

Oyuncu oyun ekranındaki harfleri kullanarak kelimeler oluşturur. Geçerli kelimeler oyun alanından kaldırılır, üstte kalan harfler aşağı düşer ve boş kalan yerlere yeni harfler gelir. Oyuncu verilen hamle sayısı içerisinde en yüksek puanı elde etmeye çalışır.

Bu oyunun temel amacı:

- kelime bilgisi kullanımını artırmak
- stratejik düşünmeyi desteklemek
- mobil programlama ile dinamik bir oyun geliştirmektir

---

## Proje Özeti

Word Crush, iki boyutlu kare grid yapısına sahip bir mobil kelime oyunudur. Her hücrede bir harf bulunur. Oyuncu bu harfleri komşuluk kurallarına uygun şekilde birleştirerek kelime oluşturur.

Geçerli kelimeler:
- puan kazandırır
- oyun alanından kaldırılır
- harflerin aşağı düşmesini sağlar
- boş alanlara yeni harflerin gelmesine neden olur

Geçersiz kelimeler:
- iptal edilir
- harfler eski haline döner
- yine de hamle azaltır

---

## Ders İsterlerine Uyum

Bu projede:

- uygulama **mobil** olarak geliştirilmektedir
- oyun **telefon veya emülatör** üzerinde çalıştırılacaktır
- **web veya masaüstü gösterimi kabul edilmez**
- kullanıcıdan ilk açılışta kullanıcı adı alınır ve saklanır
- ana ekranda:
  - Yeni Oyun
  - Skor Tablosu
  - Market  
  seçenekleri bulunur
- grid seçenekleri:
  - 10x10 → Kolay
  - 8x8 → Orta
  - 6x6 → Zor

---

## Kullanılan Teknolojiler

- React Native
- Expo
- TypeScript
- Zustand
- AsyncStorage
- React Native Gesture Handler
- React Native Reanimated

---

## Projenin Mevcut Durumu

Şu anda tamamlanan kısımlar:

- Expo tabanlı proje kurulumu
- TypeScript altyapısı
- kullanıcı adı alma ekranı
- kullanıcı adını kalıcı saklama
- ana ekran
- yeni oyun ayar ekranı
- skor tablosu ekran iskeleti
- market ekran iskeleti
- oyun ekranı iskeleti
- grid üretimi için temel altyapı
- ağırlıklı harf üretimi için temel mantık

Henüz tamamlanmayan kısımlar:

- sürükleyerek harf seçme
- komşuluk kontrolü
- sözlük doğrulama
- puan hesaplama akışı
- harf patlatma
- gravity ve refill sistemi
- skor geçmişi kaydı
- joker satın alma ve kullanma
- combo sistemi
- gridde kelime kalmama kontrolü

---

## Gereksinimler

Projeyi çalıştırmadan önce bilgisayarda şunların kurulu olması gerekir:

- Node.js
- npm
- Expo Go uygulaması  
  - iPhone için App Store
  - Android için Google Play Store

---

## Projeyi Bilgisayara Alma

Projeyi GitHub’dan çekmek için:

```bash
git clone https://github.com/zehracetinn/word_crush.git
cd word_crush