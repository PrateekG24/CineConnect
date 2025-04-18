import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { tvAPI, getImageUrl, userAPI } from "../services/api";
import MovieCard from "../components/MovieCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import "./MovieDetails.css"; // Reuse the same CSS

const TVShowDetails = () => {
  const { id } = useParams();
  const [tvShow, setTVShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistMessage, setWatchlistMessage] = useState(null);

  // Get user from localStorage
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  // Fetch TV show details
  useEffect(() => {
    const fetchTVShowDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await tvAPI.getDetails(id);
        setTVShow(response.data);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching TV show details:", err);
        setError("Failed to load TV show details. Please try again later.");
        setLoading(false);
      }
    };

    fetchTVShowDetails();

    // Reset state when id changes
    return () => {
      setTVShow(null);
      setInWatchlist(false);
      setWatchlistMessage(null);
    };
  }, [id]);

  // Check if TV show is in user's watchlist
  useEffect(() => {
    const checkWatchlist = async () => {
      if (user && tvShow) {
        try {
          const response = await userAPI.getWatchlist();
          const isInWatchlist = response.data.some(
            (item) => item.mediaType === "tv" && item.mediaId === parseInt(id)
          );
          setInWatchlist(isInWatchlist);
        } catch (err) {
          console.error("Error checking watchlist:", err);
        }
      }
    };

    checkWatchlist();
  }, [user, tvShow, id]);

  // Handle add/remove from watchlist
  const handleWatchlistToggle = async () => {
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = "/login";
      return;
    }

    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        // Remove from watchlist
        await userAPI.removeFromWatchlist(id);
        setInWatchlist(false);
        setWatchlistMessage("Removed from watchlist");
      } else {
        // Add to watchlist
        await userAPI.addToWatchlist({
          mediaType: "tv",
          mediaId: parseInt(id),
          title: tvShow.name,
          poster_path: tvShow.poster_path,
        });
        setInWatchlist(true);
        setWatchlistMessage("Added to watchlist");
      }
    } catch (err) {
      console.error("Error updating watchlist:", err);
      setWatchlistMessage("Failed to update watchlist");
    }
    setWatchlistLoading(false);

    // Clear message after 3 seconds
    setTimeout(() => {
      setWatchlistMessage(null);
    }, 3000);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <Alert type="danger" message={error} />;
  }

  if (!tvShow) {
    return <div className="container">TV Show not found</div>;
  }

  return (
    <div className="movie-details">
      {/* Backdrop */}
      <div
        className="movie-backdrop"
        style={{
          backgroundImage: `url(${getImageUrl.backdrop(tvShow.backdrop_path)})`,
        }}
      >
        <div className="backdrop-overlay"></div>
      </div>

      <div className="container">
        <div className="movie-details-content">
          {/* TV Show Poster and Info */}
          <div className="movie-details-main">
            <div className="movie-poster-container">
              <img
                src={getImageUrl.poster(tvShow.poster_path)}
                alt={tvShow.name}
                className="movie-poster"
              />
            </div>

            <div className="movie-info">
              <h1 className="movie-title">
                {tvShow.name}
                <span className="movie-year">
                  {tvShow.first_air_date &&
                    `(${new Date(tvShow.first_air_date).getFullYear()})`}
                </span>
              </h1>

              <div className="movie-meta">
                {tvShow.first_air_date && (
                  <span className="movie-date">
                    {new Date(tvShow.first_air_date).toLocaleDateString()}
                  </span>
                )}

                {tvShow.genres && tvShow.genres.length > 0 && (
                  <span className="movie-genres">
                    {tvShow.genres.map((genre) => genre.name).join(", ")}
                  </span>
                )}

                {tvShow.number_of_seasons && (
                  <span className="movie-runtime">
                    {tvShow.number_of_seasons}{" "}
                    {tvShow.number_of_seasons === 1 ? "Season" : "Seasons"}
                  </span>
                )}
              </div>

              {tvShow.tagline && (
                <div className="movie-tagline">"{tvShow.tagline}"</div>
              )}

              <div className="movie-rating">
                <div className="rating-score">
                  <span className="score-value">
                    {tvShow.vote_average.toFixed(1)}
                  </span>
                  <span className="score-total">/10</span>
                </div>
                <div className="rating-count">{tvShow.vote_count} votes</div>
              </div>

              <div className="movie-actions">
                <button
                  className={`btn ${inWatchlist ? "btn-secondary" : ""}`}
                  onClick={handleWatchlistToggle}
                  disabled={watchlistLoading}
                >
                  {watchlistLoading
                    ? "Processing..."
                    : inWatchlist
                    ? "Remove from Watchlist"
                    : "Add to Watchlist"}
                </button>

                {tvShow.homepage && (
                  <a
                    href={tvShow.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    Official Website
                  </a>
                )}
              </div>

              {watchlistMessage && (
                <div className="watchlist-message">{watchlistMessage}</div>
              )}

              <div className="movie-overview">
                <h3>Overview</h3>
                <p>{tvShow.overview}</p>
              </div>
            </div>
          </div>

          {/* TV Show Cast */}
          {tvShow.credits &&
            tvShow.credits.cast &&
            tvShow.credits.cast.length > 0 && (
              <div className="movie-section">
                <h2 className="section-title">Cast</h2>
                <div className="cast-list">
                  {tvShow.credits.cast.slice(0, 8).map((person) => (
                    <div key={person.id} className="cast-member">
                      <div className="cast-image-container">
                        <img
                          src={getImageUrl.profile(person.profile_path)}
                          alt={person.name}
                          className="cast-image"
                        />
                      </div>
                      <div className="cast-details">
                        <div className="cast-name">{person.name}</div>
                        <div className="cast-character">{person.character}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Similar TV Shows */}
          {tvShow.recommendations &&
            tvShow.recommendations.results &&
            tvShow.recommendations.results.length > 0 && (
              <div className="movie-section">
                <h2 className="section-title">You Might Also Like</h2>
                <div className="similar-movies">
                  {tvShow.recommendations.results.slice(0, 8).map((show) => (
                    <MovieCard
                      key={show.id}
                      media={{ ...show, media_type: "tv" }}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Reviews */}
          {tvShow.reviews &&
            tvShow.reviews.results &&
            tvShow.reviews.results.length > 0 && (
              <div className="movie-section">
                <h2 className="section-title">Reviews</h2>
                <div className="reviews-list">
                  {tvShow.reviews.results.slice(0, 2).map((review) => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <div className="reviewer-name">
                          {review.author_details.username || review.author}
                        </div>
                        {review.author_details.rating && (
                          <div className="reviewer-rating">
                            ★ {review.author_details.rating}/10
                          </div>
                        )}
                      </div>
                      <div className="review-content">
                        {review.content.length > 300
                          ? `${review.content.substring(0, 300)}...`
                          : review.content}
                      </div>
                      <div className="review-date">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Seasons */}
          {tvShow.seasons && tvShow.seasons.length > 0 && (
            <div className="movie-section">
              <h2 className="section-title">Seasons</h2>
              <div className="seasons-list">
                {tvShow.seasons.map((season) => (
                  <div key={season.id} className="season-card">
                    <div className="season-poster-container">
                      <img
                        src={getImageUrl.poster(season.poster_path)}
                        alt={season.name}
                        className="season-poster"
                      />
                    </div>
                    <div className="season-details">
                      <h3 className="season-name">{season.name}</h3>
                      <div className="season-info">
                        <div className="season-date">
                          {season.air_date &&
                            new Date(season.air_date).getFullYear()}
                        </div>
                        <div className="season-episodes">
                          {season.episode_count} episodes
                        </div>
                      </div>
                      {season.overview && (
                        <div className="season-overview">
                          {season.overview.length > 150
                            ? `${season.overview.substring(0, 150)}...`
                            : season.overview}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVShowDetails;