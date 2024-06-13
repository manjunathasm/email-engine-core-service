document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM fully loaded and parsed');

  let selectedFolderId = null;
  const pollingInterval = 30000; // 30 seconds
  const refreshTokenInterval = 60 * 60 * 1000; // refresh token every 1 hour

  // Function to handle token expiration and refresh
  async function handleTokenExpiration() {
    console.log('Token expired. Refreshing token...');
    try {
      const response = await fetch('/auth/outlook/refresh/token', {
        method: 'PATCH',
      });
      if (response.ok) {
        // const data = await response.json();
        console.log('Token refreshed successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to refresh token:', errorData);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }
  setInterval(handleTokenExpiration, refreshTokenInterval);

  // Function to load folders
  async function loadFolders() {
    try {
      const response = await fetch('/email/folders');
      const data = await response.json();

      const folderList = document.getElementById('folder-list');
      folderList.innerHTML = '';

      data.forEach((folder) => {
        const folderItem = document.createElement('li');
        folderItem.classList.add('mb-2');
        folderItem.innerHTML = `
          <a href="#${folder.DisplayName}" class="folder-link text-blue-500 hover:underline" data-folder-id="${folder.Id}">
            ${folder.DisplayName} (${folder.UnreadItemCount}/${folder.TotalItemCount})
          </a>
        `;
        folderList.appendChild(folderItem);
      });
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  }

  // Function to load mails for a selected folder
  async function loadMailsForFolder(folderId) {
    try {
      const response = await fetch(
        `/email/conversations/${folderId}?pageSize=20`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      );
      const data = await response.json();

      const mailsList = document.getElementById('mails-list');
      mailsList.innerHTML = '';

      data.emails.forEach((mail) => {
        const date = new Date(mail.ReceivedDateTime);
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

  // Function to poll folders and mails for the selected folder
  async function pollMails() {
    await loadFolders();
    if (selectedFolderId) {
      await loadMailsForFolder(selectedFolderId);
    }
  }

  // Set up polling to refresh mails every pollingInterval milliseconds
  setInterval(pollMails, pollingInterval);

  // Function to display email content in a modal dialog
  function displayMailContent(content) {
    const modalBody = document.getElementById('mail-preview-body');
    modalBody.innerHTML = content;
    document.getElementById('mailPreviewModal').classList.remove('hidden');
  }

  // Initial load of mails for the selected folder
  const folderLinks = document.getElementById('folder-list');
  folderLinks.addEventListener('click', async (event) => {
    if (event.target.classList.contains('folder-link')) {
      event.preventDefault();
      selectedFolderId = event.target.getAttribute('data-folder-id');
      await loadMailsForFolder(selectedFolderId);
    }
  });

  // Sync button click handler
  const syncButton = document.getElementById('sync-button');
  syncButton.addEventListener('click', async () => {
    console.log('Sync button clicked');
    try {
      const response = await fetch('/email/sync');
      if (response.ok) {
        const data = await response.json();
        await loadFolders(); // Reload folders after sync
        if (selectedFolderId) {
          await loadMailsForFolder(selectedFolderId);
        }
        alert(`Mails synced ${JSON.stringify(data)}`);
      } else {
        const errorData = await response.json();
        alert(errorData?.message);
      }
    } catch (error) {
      console.error('Error syncing mails:', error);
      alert('Error syncing mails\nError: ' + error.message);
    }
  });

  // Event delegation to handle click events on dynamically added elements
  const mailsList = document.getElementById('mails-list');
  mailsList.addEventListener('click', (event) => {
    if (event.target && event.target.classList.contains('view-mail-link')) {
      event.preventDefault();
      const mailId = event.target.getAttribute('data-mail-id');
      const mailContent = document.getElementById(
        'mail-content-' + mailId,
      ).innerHTML;
      displayMailContent(mailContent);
    }
  });

  // Modal close event handler
  const closeModalButton = document.getElementById('close-modal');
  closeModalButton.addEventListener('click', () => {
    document.getElementById('mailPreviewModal').classList.add('hidden');
  });

  // Initial load of mails for the default folder
  // await loadMailsForFolder(selectedFolderId);
});
