const backgroundImages = [
  "http://wallpapercave.com/wp/zm8bgId.jpg",
  "https://s-media-cache-ak0.pinimg.com/originals/31/80/d2/3180d2c319d8400c096696b687f9a5b5.jpg",
  "/images/sexy-image.jpg",
  "https://image.freepik.com/free-psd/abstract-background-design_1297-84.jpg",
];
window.onload = () => {
  let bgElement = document.getElementsByClassName("jm-background-img")[0];
  let bgIndex = 0;
  bgElement.style.backgroundImage = `url('${backgroundImages[bgIndex++]}')`;
  bgElement.style.transition = 'background-image 1s';
  let changeBg = () => {
    bgElement.style.backgroundImage = `url('${backgroundImages[bgIndex++ % backgroundImages.length]}')`;
  };
  setInterval(changeBg, 10000);
};
