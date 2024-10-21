document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString(undefined, options); // Format the current date

    // Use innerHTML to insert HTML content
    document.getElementById('currentDate').innerHTML = `<p style="border:none;border-radius:5px;padding:4px 5px;display:inline;">${formattedDate}</p>`;
  });