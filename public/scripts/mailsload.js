document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');

  document
    .getElementById('folder-list')
    .addEventListener('click', async (event) => {
      if (event.target.classList.contains('folder-link')) {
        event.preventDefault();
        const folderId = event.target.getAttribute('data-folder-id');

        try {
          const response = await fetch(`/email/conversations/${folderId}`);
          const data = await response.json();

          const mailsList = document.getElementById('mails-list');
          mailsList.innerHTML = '';

          data.emails.forEach((mail) => {
            const date = new Date(mail.ReceivedDateTime);
            // Format the date to a human-readable format
            const options = {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
            };

            const formattedDate = date.toLocaleDateString('en-US', options);

            const mailItem = document.createElement('li');
            mailItem.classList.add(
              'list-group-item',
              'py-4',
              'border-b',
              'border-gray-200',
            );
            mailItem.innerHTML = `
              <div class="flex justify-between">
                <div>
                  <h5 class="text-lg font-bold">${mail.Subject}</h5>
                  <p class="text-sm text-gray-600">${mail.From.EmailAddress.Name} &lt;${mail.From.EmailAddress.Address}&gt;</p>
                  <a href="#" class="mt-2 inline-block text-blue-500 hover:underline view-mail-link" data-mail-id="${mail.Id}">View Mail</a>
                  <!-- Hidden div to store full mail content -->
                  <div id="mail-content-${mail.Id}" class="hidden">${mail.Body.Content}</div>
                </div>
                <div class="text-right text-sm text-gray-600">
                  <p>${formattedDate}</p>
                </div>
              </div>
            `;
            mailsList.appendChild(mailItem);
          });
        } catch (error) {
          console.error('Error fetching mails:', error);
        }
      }
    });

  document.getElementById('sync-button').addEventListener('click', async () => {
    console.log('Sync button clicked');

    try {
      const response = await fetch('/email/sync');

      if (response.ok) {
        const data = await response.json();
        alert(`Mails synced ${JSON.stringify(data)}`);
        location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData?.message);
      }
    } catch (error) {
      console.error('Error syncing mails:', error);
      alert('Error syncing mails\nError: ' + error.message);
    }
  });

  // Use event delegation to handle click events on dynamically added elements
  document
    .getElementById('mails-list')
    .addEventListener('click', function (event) {
      if (event.target && event.target.classList.contains('view-mail-link')) {
        event.preventDefault();
        const mailId = event.target.getAttribute('data-mail-id');
        const mailContent = document.getElementById(
          'mail-content-' + mailId,
        ).innerHTML;
        displayMailContent(mailContent);
      }
    });
});

// Function to display email content in a modal dialog
function displayMailContent(content) {
  const modalBody = document.getElementById('mail-preview-body');
  modalBody.innerHTML = content;
  document.getElementById('mailPreviewModal').classList.remove('hidden');
}

// Event listener for closing the modal
document.getElementById('close-modal').addEventListener('click', function () {
  document.getElementById('mailPreviewModal').classList.add('hidden');
});
