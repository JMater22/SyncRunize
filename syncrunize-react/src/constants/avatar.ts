export const DEFAULT_AVATAR =
  'https://ionicframework.com/docs/img/demos/avatar.svg';

/**
 * Generate avatar URL - currently just returns default avatar
 * @param _profilePicture - The profile picture path (unused for now)
 * @returns Default avatar URL
 */
export const generateAvatarUrl = (_profilePicture?: string | null): string => {
  return DEFAULT_AVATAR;
};
