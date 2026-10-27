const axios = require('axios');

const OPEN_LIBRARY_BASE = 'https://openlibrary.org';
const COVERS_BASE = 'https://covers.openlibrary.org/b';
const REQUEST_TIMEOUT_MS = 8000;

class OpenLibraryService {
  static async searchBooks(query, limit = 15) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    const cleanQuery = query.trim().slice(0, 100);
    const cleanLimit = Math.max(1, Math.min(30, parseInt(limit, 10) || 15));

    try {
      const response = await axios.get(`${OPEN_LIBRARY_BASE}/search.json`, {
        params: {
          q: cleanQuery,
          limit: cleanLimit,
          fields: 'key,title,author_name,first_publish_year,cover_i,isbn,subject,number_of_pages_median'
        },
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'User-Agent': 'BookMind-AI/1.0 (academic/portfolio book assistant; contact: divyansh)'
        }
      });

      const docs = response.data?.docs || [];
      return docs.map(doc => {
        const coverId = doc.cover_i;
        const isbn = Array.isArray(doc.isbn) && doc.isbn.length > 0 ? doc.isbn[0] : null;
        
        let coverUrl = '';
        if (coverId && Number(coverId) > 0) {
          coverUrl = `${COVERS_BASE}/id/${coverId}-L.jpg`;
        } else if (isbn && typeof isbn === 'string') {
          const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '');
          if (cleanIsbn) {
            coverUrl = `${COVERS_BASE}/isbn/${cleanIsbn}-L.jpg`;
          }
        }

        const rawAuthors = doc.author_name;
        const authors = Array.isArray(rawAuthors) && rawAuthors.length > 0
          ? rawAuthors.map(a => String(a).trim()).filter(Boolean).slice(0, 5)
          : ['Unknown Author'];

        const rawSubjects = doc.subject;
        const genres = Array.isArray(rawSubjects)
          ? rawSubjects.map(s => String(s).trim()).filter(Boolean).slice(0, 5)
          : [];

        return {
          openLibraryId: doc.key ? String(doc.key).replace('/works/', '').trim() : '',
          title: doc.title ? String(doc.title).trim() : 'Untitled Book',
          authors: authors.length ? authors : ['Unknown Author'],
          publishYear: doc.first_publish_year ? parseInt(doc.first_publish_year, 10) : null,
          totalPages: doc.number_of_pages_median ? parseInt(doc.number_of_pages_median, 10) : 250,
          genres,
          coverUrl,
          isbn: isbn || ''
        };
      });
    } catch (error) {
      console.warn('OpenLibrary API search error:', error.message);
      // Graceful fallback to empty array so frontend search displays empty state rather than crashing
      return [];
    }
  }

  static async getBookDetails(workId) {
    if (!workId || typeof workId !== 'string') return null;
    const cleanId = workId.replace('/works/', '').replace(/[^a-zA-Z0-9_-]/g, '').trim();
    if (!cleanId) return null;

    try {
      const response = await axios.get(`${OPEN_LIBRARY_BASE}/works/${cleanId}.json`, { 
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'User-Agent': 'BookMind-AI/1.0 (academic/portfolio book assistant; contact: divyansh)'
        }
      });
      const data = response.data;
      if (!data) return null;

      let description = '';  
      if (typeof data.description === 'string') {
        description = data.description;
      } else if (data.description && typeof data.description.value === 'string') {
        description = data.description.value;
      }

      let coverUrl = '';
      if (Array.isArray(data.covers) && data.covers.length > 0 && Number(data.covers[0]) > 0) {
        coverUrl = `${COVERS_BASE}/id/${data.covers[0]}-L.jpg`;
      }

      return {
        openLibraryId: cleanId,
        title: data.title ? String(data.title).trim() : '',
        description: description.slice(0, 2000),
        coverUrl,
        subjects: Array.isArray(data.subjects) ? data.subjects.slice(0, 8) : []
      };
    } catch (error) {
      console.warn(`OpenLibrary work fetch error for ${cleanId}:`, error.message);
      return null;
    }
  }
}

module.exports = OpenLibraryService;
