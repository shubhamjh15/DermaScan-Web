from flask import Flask, jsonify, request, render_template, send_from_directory
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
from groq import Groq
import os
import subprocess


app = Flask(__name__)

# Load the pre-trained model
model_path = r"C:\Users\jha77\Downloads\trained_model.keras"
model = load_model(model_path)

# Class indices for the predictions
class_indices = {
    'Acne': 0,
    'Hyperpigmentation': 1,
    'Nail_Psoriasis': 2,
    'sjs_ten': 3,
    'vitiligo': 4
}

# Global variable to store the latest prediction result
prediction_result = None

def make_prediction(img, model, input_shape=(224, 224)):
    try:
        # Resize and preprocess the image
        img = img.resize(input_shape)
        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0  # Normalize the image

        # Make the prediction
        prediction = model.predict(img_array)
        class_idx = np.argmax(prediction, axis=1)[0]
        confidence = prediction[0][class_idx]

        # Get the class label from the index
        class_label = list(class_indices.keys())[list(class_indices.values()).index(class_idx)]

        return class_label, confidence
    except Exception as e:
        print(f"Error during prediction: {e}")
        return None, None

@app.route('/')
def index():
    """Serve the homepage from the templates folder."""
    return render_template('index.html')

@app.route('/config.json', methods=['GET'])
def serve_config():
    """Serve the configuration file containing the API endpoints."""
    return send_from_directory(os.getcwd(), 'static/config.json')

@app.route('/predict', methods=['POST'])
def predict():
    """Handle image upload, make prediction, and store the result in the global variable."""
    global prediction_result  # Access the global variable
    try:
        # Get the uploaded image
        file = request.files['image']
        img = Image.open(file.stream)

        # Make prediction
        class_label, confidence = make_prediction(img, model)

        # Store the result in the global variable
        if class_label is not None:
            prediction_result = {
                'class': class_label,
                'confidence': round(float(confidence) * 100, 2)  # Convert to percentage and ensure JSON serialization
            }
            return jsonify(prediction_result)
        else:
            return jsonify({'error': 'Prediction failed'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred: {e}'}), 500
    
@app.route('/remedy', methods=['POST'])
def get_remedy():
    global prediction_result

    # Check if a prediction exists before attempting to fetch a remedy
    if not prediction_result:
        return jsonify({'error': 'No prediction made yet'}), 400

    try:
        client = Groq(
            api_key="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"
        )
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[  
                {
                    "role": "user",
                    "content": f"Suggest 5 scientifically backed home remedies for {prediction_result['class']} that can be safely used by patients."
                },
                {
                    "role": "assistant",
                    "content": "I'm happy to help!" 
                }
            ],   
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=True,
            stop=None,
        )

        response_content = ""

        for chunk in completion:
            if chunk.choices[0].delta.content:
                response_content += chunk.choices[0].delta.content

        # Format the remedy content into a structured list and remove asterisks
        remedy_points = response_content.split("\n")
        formatted_remedy = []

        for point in remedy_points:
            if point.strip():  # Only add non-empty lines
                # Remove leading asterisks from each point
                cleaned_point = point.lstrip('*').strip()
                formatted_remedy.append(f"<li>{cleaned_point}</li>")

        remedy_html = "<ul>" + "".join(formatted_remedy) + "</ul>"

        return jsonify({'remedy': remedy_html})

    except Exception as e:
        return jsonify({'error': f'An error occurred: {e}'}), 500


@app.route('/get_result', methods=['GET'])
def get_result():
    """Return the latest prediction result stored in the global variable."""
    global prediction_result  # Access the global variable
    if prediction_result:
        return jsonify(prediction_result)
    else:
        return jsonify({'error': 'No prediction available'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

