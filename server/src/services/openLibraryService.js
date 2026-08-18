const axios = require('axios');

const OPEN_LIBRARY_BASE = 'https://openlibrary.org';
const COVERS_BASE = 'https://covers.openlibrary.org/b';

class OpenLibraryService {
  static async searchBooks(query, limit = 15) {
    if (!query || !query.trim()) return [];

    try {
      const response = await axios.get(`${OPEN_LIBRARY_BASE}/search.json`, {
        params: {
          q: query.trim(),
          limit: limit,
          fields: 'key,title,author_name,first_publish_year,cover_i,isbn,subject,number_of_pages_median'
        },
        timeout: 8000
      });

      const docs = response.data.docs || [];
      return docs.map(doc => {
        const coverId = doc.cover_i;
        const isbn = doc.isbn && doc.isbn[0];
        
        let coverUrl = '';
        if (coverId) {
          coverUrl = `${COVERS_BASE}/id/${coverId}-L.jpg`;
        } else if (isbn) {
          coverUrl = `${COVERS_BASE}/isbn/${isbn}-L.jpg`;
        }

        return {
          openLibraryId: doc.key ? doc.key.replace('/works/', '') : '',
          title: doc.title || 'Untitled',
          authors: doc.author_name || ['Unknown Author'],
          publishYear: doc.first_publish_year || null,
          totalPages: doc.number_of_pages_median || 250,
          genres: (doc.subject || []).slice(0, 5),
          coverUrl: coverUrl,
          isbn: isbn || ''
        };
      });
    } catch (error) {
      console.error('OpenLibrary API search error:', error.message);
      return [];
    }
  }

  static async getBookDetails(workId) {
    if (!workId) return null;
    const cleanId = workId.replace('/works/', '');
    try {
      const response = await axios.get(`${OPEN_LIBRARY_BASE}/works/${cleanId}.json`, { timeout: 8000 });
      const data = response.data;
      

      // to handle the description type as openLibrary may return the description in different formet also.
      let description = '';  
      if (typeof data.description === 'string') {
        description = data.description;
      } else if (data.description && data.description.value) {
        description = data.description.value;
      }

      let coverUrl = '';
      if (data.covers && data.covers.length > 0 && data.covers[0] > 0) {
        coverUrl = `${COVERS_BASE}/id/${data.covers[0]}-L.jpg`;
      }

      return {
        openLibraryId: cleanId,
        title: data.title || '',
        description: description,
        coverUrl: coverUrl,
        subjects: data.subjects || []
      };
    } catch (error) {
      console.error(`OpenLibrary work fetch error for ${cleanId}:`, error.message);
      return null;
    }
  }
}

module.exports = OpenLibraryService;
