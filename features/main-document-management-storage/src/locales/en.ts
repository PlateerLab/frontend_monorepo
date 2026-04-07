import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  storage: {
    searchPlaceholder: 'Search file storages...',
    filters: {
      all: 'All',
      personal: 'Personal',
      shared: 'Shared',
    },
    buttons: {
      newStorage: 'New Storage',
    },
    createModal: {
      title: 'Create New File Storage',
      name: 'Storage Name',
      namePlaceholder: 'Enter storage name',
      description: 'Description',
      descriptionPlaceholder: 'Enter a description for the storage',
      encrypt: 'Encryption',
      encryptDesc: 'Protect the storage with a password',
      password: 'Password',
      passwordPlaceholder: 'Enter password',
      passwordConfirm: 'Confirm Password',
      passwordConfirmPlaceholder: 'Re-enter password',
      create: 'Create',
      creating: 'Creating...',
      cancel: 'Cancel',
    },
    empty: {
      title: 'No file storages',
      description: 'Create a new file storage',
    },
    files: 'files',
    passwordModal: {
      title: 'Encrypted Storage',
      description: 'This storage is password protected. Please enter the password to access.',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter password',
      passwordRequired: 'Please enter a password.',
      passwordIncorrect: 'Incorrect password.',
      verify: 'Verify',
      verifying: 'Verifying...',
    },
    dropOverlay: 'Drop files to upload to storage',
    dropConfirm: {
      title: 'Upload Confirmation',
      upload: 'Upload',
      uploading: 'Uploading...',
      storageSuffix: 'storage:',
      fileCountSuffix: ' file(s) will be uploaded.',
    },
    dropSelect: {
      title: 'Select Storage',
      description: 'Select a storage to upload the files to.',
      createNew: 'Create New Storage',
    },
    detail: {
      empty: 'No files',
      dropOverlay: 'Drop files here',
      dropConfirm: {
        title: 'Upload Confirmation',
        upload: 'Upload',
        pathSuffix: 'path:',
        fileCountSuffix: ' file(s) will be uploaded.',
        moreFiles: ' more files',
      },
      error: {
        loadFailed: 'Failed to load files',
      },
      buttons: {
        createFolder: 'New Folder',
        uploadFile: 'Upload Document',
        uploadFolder: 'Upload Folder',
      },
      uploadModal: {
        title: 'Upload File',
        file: 'File',
        selectFile: 'Click to select a file',
        upload: 'Upload',
        uploading: 'Uploading...',
      },
      createFolderModal: {
        title: 'Create Folder',
        name: 'Folder Name',
        namePlaceholder: 'Enter folder name',
      },
      directoryTree: {
        title: 'Directory Structure',
        filesSuffix: ' files',
        searchPlaceholder: 'Search files...',
      },
    },
  },
};
