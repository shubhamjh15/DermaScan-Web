const form = document.getElementById("uploadForm");
const resultDiv = document.getElementById("result");
const remedyButton = document.getElementById("getRemedy");
const remedyResultDiv = document.getElementById("remedyResult");
let predictionResult = null;

function navigateToNextPage() {
  const nextSection = document.querySelector(".ht-Use");
  nextSection.scrollIntoView({ behavior: "smooth" });
}

const goTOTopBtn = document.getElementById("go-to-top");
console.log(goTOTopBtn);

window.onscroll = () => {
  scrollFunction();
};
function scrollFunction() {
  if (
    document.body.scrollTop > 300 ||
    document.documentElement.scrollTop > 300
  ) {
    goTOTopBtn.style.display = "block";
  } else {
    goTOTopBtn.style.display = "none";
  }
}
goTOTopBtn.onclick = () => {
  goTOTopBtn.style.display = "none";
  window.scroll({
    top: 0,
    behavior: "smooth",
  });
};
// Load config.json to get API endpoints
fetch("/config.json")
  .then((response) => response.json())
  .then((data) => {
    endpoints = data;
  })
  .catch((error) => {
    console.error("Error loading configuration:", error);
  });

form.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  const fileInput = document.getElementById("image");
  formData.append("image", fileInput.files[0]);

  try {
    const response = await fetch(endpoints.predictEndpoint, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      predictionResult = data;
      resultDiv.innerHTML = `<p>Predicted Class: <strong>${data.class}</strong></p>
                                   <p>Confidence: <strong>${data.confidence}%</strong></p>`;

      // Show the "Get Remedy" button after prediction
      remedyButton.style.display = "block";
    } else {
      resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
    }
  } catch (error) {
    resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
  }
};

remedyButton.onclick = async () => {
  try {
    const response = await fetch(endpoints.remedyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ disease: predictionResult.class }),
    });

    const data = await response.json();

    if (response.ok) {
      remedyResultDiv.style.display = "block";
      remedyResultDiv.innerHTML = `<h3>Remedy for ${predictionResult.class}:</h3><p>${data.remedy}</p>`;
    } else {
      remedyResultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
    }
  } catch (error) {
    remedyResultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
  }
};
document.getElementById("image").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Dynamically create the preview section if it doesn't exist
            let previewImg = document.getElementById("previewImg");
            if (!previewImg) {
                previewImg = document.createElement("img");
                previewImg.id = "previewImg";
                document.getElementById("uploadForm").appendChild(previewImg);
            }

            // Set the image source and display it
            previewImg.src = e.target.result;
            previewImg.style.display = "block"; // Show the image
        };
        reader.readAsDataURL(file); // Read the image file as a data URL
    }
});
remedyButton.onclick = async () => {
    try {
      const response = await fetch(endpoints.remedyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ disease: predictionResult.class }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Display the remedy section
        remedyResultDiv.style.display = "block";
  
        // Dynamically add remedies as a structured list
        const remedyList = data.remedy
          .split("<li>") // Split the content by list items
          .map((item) => item.replace(/<\/?[^>]+(>|$)/g, "").trim()) // Remove any HTML tags
          .filter((item) => item) // Remove empty strings
          .map((item) => `<li>${item}</li>`) // Re-wrap each item in <li>
          .join(""); // Join the items back together
  
        remedyResultDiv.innerHTML = `
          <h3>Remedies for ${predictionResult.class}:</h3>
          <ul>${remedyList}</ul>
        `;
      } else {
        remedyResultDiv.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
      }
    } catch (error) {
      remedyResultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
  };

  remedyButton.onclick = async () => {
    try {
      const response = await fetch(endpoints.remedyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ disease: predictionResult.class }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Display the remedy section
        remedyResultDiv.style.display = "block";
  
        // Parse the remedies and build table rows
        const remedyList = data.remedy
          .split("<li>") // Split the content by list items
          .map((item) => item.replace(/<\/?[^>]+(>|$)/g, "").trim()) // Remove any HTML tags
          .filter((item) => item); // Remove empty strings
  
        // Construct the table HTML
        let tableHTML = `
          <h3>Remedies for ${predictionResult.class}:</h3>
          <table>
            <thead>
              <tr>
                <th>Remedies for ${predictionResult.class}:</th>
              </tr>
            </thead>
            <tbody>
        `;
  
        remedyList.forEach((remedy) => {
          tableHTML += `
            <tr>
              <td>${remedy}</td>
            </tr>
          `;
        });
  
        tableHTML += `
            </tbody>
          </table>
        `;
  
        // Insert the table into the remedyResultDiv
        remedyResultDiv.innerHTML = tableHTML;
      } else {
        remedyResultDiv.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
      }
    } catch (error) {
      remedyResultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
  };
