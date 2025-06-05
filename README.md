# 🚗 Vehicle Damage Assessment System for Rentals 🔍

## 📋 Overview

This application enhances the rental vehicle return process by implementing automated damage assessment through image analysis. The system captures images of vehicles at the end of a rental session, sends them to a damage assessment server, and calculates appropriate penalties based on detected damage. This streamlines the return process, reduces disputes, and ensures consistent evaluation of vehicle condition.

## ✨ Key Features

- 📸 **Camera and Gallery Integration**: Capture vehicle images directly or select from gallery
- 🤖 **Server-based Damage Analysis**: Images are analyzed by a specialized AI damage assessment server
- 📊 **Confidence-based Penalty System**: Penalties are calculated based on the damage confidence level
- ⚙️ **Configurable Server Connection**: Flexible server configuration for different environments
- 🔄 **Network Resilience**: Handles connection issues with graceful fallbacks
- 👥 **User-friendly Interface**: Clear UI with real-time feedback on image processing

## 🛠️ Technical Implementation

The system is built using:
- ⚛️ React Native / Expo for cross-platform mobile support
- 🎨 Custom UI components for a seamless user experience
- 🔌 RESTful API integration with the damage assessment server
- 🔁 Adaptive error handling with appropriate user feedback

## ⚡ How It Works

1. 🏁 **Rental Completion**: When a user completes a rental session, they can initiate damage assessment
2. 📱 **Image Capture**: Users can capture a new photo of the vehicle or select one from their gallery
3. 📤 **Image Processing**: The selected image is sent to the damage assessment server
4. 🧠 **Damage Analysis**: The server processes the image using advanced AI algorithms to detect any damage
5. 📏 **Confidence Rating**: The server returns a confidence score indicating the likelihood of damage
6. 💰 **Penalty Calculation**: The system calculates an appropriate penalty based on the confidence level
7. 📢 **User Notification**: The user is informed of the assessment result and any applicable penalties

## 📝 Response Format

The damage assessment server returns results in the following format:
```
Predicted Damage Type: damage
Confidence Level: 74.81581568717957%
```

This confidence value determines the severity of the penalty applied to the rental.

## 🌐 Server Configuration

The application can be configured to connect to different server environments:
- 🚀 Production server: http://<hosted_ip_address>/
- 🧪 Development/test servers: multiple options available in settings

## 🖼️ Sample Images

The system includes sample damage images for testing purposes:
- 🔴 d1.jpg: Minor damage sample
- 🔴 d2.jpg: Moderate damage sample
- 📁 Additional images can be added to the assets/images folder

## 📱 Usage Instructions

1. ✅ Complete a rental session in the app
2. 🔍 Select "Assess Vehicle Condition" when prompted
3. 📸 Choose to take a new photo or select from gallery
4. ⏳ Wait for the image to be processed by the server
5. 📊 Review the damage assessment results and any applicable penalties
6. ✅ Confirm to complete the rental return process

## 🚀 Future Enhancements

- 📷 Multiple image upload support for comprehensive vehicle assessment
- 🗺️ Damage location mapping on vehicle diagrams
- 💵 Integration with repair cost estimation systems
- 📜 Historical comparison with pre-rental vehicle condition
- 📵 Offline mode with queued uploads when connection is restored

---

💡 This damage assessment system significantly improves operational efficiency for rental companies while providing transparency and consistency for customers during the vehicle return process.


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

If you have any questions or feedback, please open an issue or contact the repository owner.

---

⭐ Don't forget to star this repository if you find it useful! ⭐
