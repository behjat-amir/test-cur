const words = [
  // Animals
  'cat', 'dog', 'elephant', 'giraffe', 'lion', 'monkey', 'penguin', 'tiger', 'zebra',
  // Food
  'pizza', 'hamburger', 'sushi', 'ice cream', 'sandwich', 'cake', 'cookie',
  // Objects
  'chair', 'table', 'computer', 'phone', 'book', 'pencil', 'clock', 'glasses',
  // Nature
  'tree', 'flower', 'sun', 'moon', 'star', 'cloud', 'mountain', 'beach',
  // Transportation
  'car', 'bicycle', 'airplane', 'boat', 'train', 'bus', 'helicopter',
  // Sports
  'football', 'basketball', 'tennis', 'baseball', 'soccer', 'volleyball',
  // Clothes
  'shirt', 'pants', 'shoes', 'hat', 'dress', 'socks', 'jacket',
  // House
  'house', 'door', 'window', 'bed', 'lamp', 'television', 'refrigerator',
  // People
  'baby', 'teacher', 'doctor', 'chef', 'artist', 'police', 'firefighter',
  // Others
  'rainbow', 'camera', 'guitar', 'robot', 'castle', 'ghost', 'dragon'
];

const getRandomWord = () => {
  return words[Math.floor(Math.random() * words.length)];
};

module.exports = {
  getRandomWord
}; 