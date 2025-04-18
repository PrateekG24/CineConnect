import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { movieAPI, getImageUrl, userAPI } from "../services/api";
import MovieCard from "../components/MovieCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import "./MovieDetails.css";

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistMessage, setWatchlistMessage] = useState(null);
  const [displayedReviews, setDisplayedReviews] = useState(3);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [isEditingReview, setIsEditingReview] = useState(false);

  // Get user from localStorage
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  // Fetch movie details
  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await movieAPI.getDetails(id);
        setMovie(response.data);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching movie details:", err);
        setError("Failed to load movie details. Please try again later.");
        setLoading(false);
      }
    };

    fetchMovieDetails();

    // Reset state when id changes
    return () => {
      setMovie(null);
      setInWatchlist(false);
      setWatchlistMessage(null);
    };
  }, [id]);

  // Check if movie is in user's watchlist
  useEffect(() => {
    const checkWatchlist = async () => {
      if (user && movie) {
        try {
          const response = await userAPI.getWatchlist();
          const isInWatchlist = response.data.some(
            (item) =>
              item.mediaType === "movie" && item.mediaId === parseInt(id)
          );
          setInWatchlist(isInWatchlist);
        } catch (err) {
          console.error("Error checking watchlist:", err);
        }
      }
    };

    checkWatchlist();
  }, [user, movie, id]);

  // Check if user has reviewed this movie
  useEffect(() => {
    const checkUserReview = async () => {
      if (user) {
        try {
          const response = await userAPI.getUserReviews();
          const foundReview = response.data.find(
            (review) =>
              review.mediaId === id.toString() && review.mediaType === "movie"
          );

          if (foundReview) {
            setUserReview(foundReview);
          }
        } catch (err) {
          console.error("Error checking user review:", err);
        }
      }
    };

    checkUserReview();
  }, [user, id]);

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
          mediaType: "movie",
          mediaId: parseInt(id),
          title: movie.title,
          poster_path: movie.poster_path,
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

  // Show more reviews handler
  const handleShowMoreReviews = () => {
    setDisplayedReviews(movie.reviews.results.length);
  };

  // Show review form handler
  const toggleReviewForm = () => {
    if (userReview && !isEditingReview) {
      // Load existing review content for editing
      setReviewContent(userReview.content);
      setReviewRating(userReview.rating);
      setIsEditingReview(true);
    } else if (isEditingReview) {
      // Cancel editing
      setReviewContent("");
      setReviewRating(0);
      setIsEditingReview(false);
    }
    setShowReviewForm(!showReviewForm);
  };

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewRating === 0) {
      setReviewError("Please select a rating");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError(null);

      if (isEditingReview && userReview) {
        // Delete the old review first
        await userAPI.deleteReview(userReview._id);
      }

      // Make sure mediaId is a string for consistency with the model
      const response = await userAPI.submitReview(id.toString(), "movie", {
        content: reviewContent,
        rating: reviewRating,
      });

      // Update userReview state with the new review
      setUserReview(response.data);
      setIsEditingReview(false);

      // Refresh movie details to show the new review
      const movieResponse = await movieAPI.getDetails(id);
      setMovie(movieResponse.data);

      // Reset form
      setReviewContent("");
      setReviewRating(0);
      setShowReviewForm(false);
      setReviewSubmitting(false);
    } catch (err) {
      console.error("Error submitting review:", err);
      setReviewError("Failed to submit your review. Please try again.");
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <Alert type="danger" message={error} />;
  }

  if (!movie) {
    return <div className="container">Movie not found</div>;
  }

  // Format runtime to hours and minutes
  const formatRuntime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="movie-details">
      {/* Backdrop */}
      <div
        className="movie-backdrop"
        style={{
          backgroundImage: `url(${getImageUrl.backdrop(movie.backdrop_path)})`,
        }}
      >
        <div className="backdrop-overlay"></div>
      </div>

      <div className="container">
        <div className="movie-details-content">
          {/* Movie Poster and Info */}
          <div className="movie-details-main">
            <div className="movie-poster-container">
              <img
                src={getImageUrl.poster(movie.poster_path)}
                alt={movie.title}
                className="movie-poster"
              />
            </div>

            <div className="movie-info">
              <h1 className="movie-title">
                {movie.title}
                <span className="movie-year">
                  {movie.release_date &&
                    `(${new Date(movie.release_date).getFullYear()})`}
                </span>
              </h1>

              <div className="movie-meta">
                {movie.release_date && (
                  <span className="movie-date">
                    {new Date(movie.release_date).toLocaleDateString()}
                  </span>
                )}

                {movie.genres && movie.genres.length > 0 && (
                  <span className="movie-genres">
                    {movie.genres.map((genre) => genre.name).join(", ")}
                  </span>
                )}

                {movie.runtime && (
                  <span className="movie-runtime">
                    {formatRuntime(movie.runtime)}
                  </span>
                )}
              </div>

              {movie.tagline && (
                <div className="movie-tagline">"{movie.tagline}"</div>
              )}

              <div className="movie-rating">
                <div className="rating-score">
                  <span className="score-value">
                    {movie.vote_average.toFixed(1)}
                  </span>
                  <span className="score-total">/10</span>
                </div>
                <div className="rating-count">{movie.vote_count} votes</div>
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

                {movie.homepage && (
                  <a
                    href={movie.homepage}
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
                <p>{movie.overview}</p>
              </div>
            </div>
          </div>

          {/* Movie Cast */}
          {movie.credits &&
            movie.credits.cast &&
            movie.credits.cast.length > 0 && (
              <div className="movie-section">
                <h2 className="section-title">Cast</h2>
                <div className="cast-list">
                  {movie.credits.cast.slice(0, 8).map((person) => (
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

          {/* Similar Movies */}
          {movie.recommendations &&
            movie.recommendations.results &&
            movie.recommendations.results.length > 0 && (
              <div className="movie-section">
                <h2 className="section-title">You Might Also Like</h2>
                <div className="similar-movies">
                  {movie.recommendations.results.slice(0, 8).map((movie) => (
                    <MovieCard
                      key={movie.id}
                      media={{ ...movie, media_type: "movie" }}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Reviews */}
          <div className="movie-section">
            <div className="section-header">
              <h2 className="section-title">Reviews</h2>
              {user && (
                <button
                  className="btn btn-secondary"
                  onClick={toggleReviewForm}
                >
                  {userReview
                    ? showReviewForm
                      ? "Cancel"
                      : "Edit Review"
                    : "Write a Review"}
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="review-form-container">
                <form onSubmit={handleReviewSubmit} className="review-form">
                  {reviewError && <Alert type="danger" message={reviewError} />}

                  <div className="rating-select">
                    <label>Your Rating:</label>
                    <div className="star-rating">
                      {[...Array(10)].map((_, i) => (
                        <span
                          key={i}
                          className={`star ${
                            i < reviewRating ? "selected" : ""
                          }`}
                          onClick={() => setReviewRating(i + 1)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reviewContent">Your Review:</label>
                    <textarea
                      id="reviewContent"
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      rows="5"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn"
                    disabled={reviewSubmitting}
                  >
                    {reviewSubmitting
                      ? "Submitting..."
                      : isEditingReview
                      ? "Update Review"
                      : "Submit Review"}
                  </button>
                </form>
              </div>
            )}

            {/* User's Review (if exists and not currently editing) */}
            {userReview && !showReviewForm && (
              <div className="user-review">
                <h3 className="user-review-title">Your Review</h3>
                <div className="review-card user-review-card">
                  <div className="review-header">
                    <div className="reviewer-name">You ({user.username})</div>
                    <div className="reviewer-rating">
                      ★ {userReview.rating}/10
                    </div>
                  </div>
                  <div className="review-content">{userReview.content}</div>
                  <div className="review-date">
                    {new Date(userReview.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {/* Other Reviews List */}
            {movie.reviews &&
            movie.reviews.results &&
            movie.reviews.results.length > 0 ? (
              <>
                {(userReview || movie.reviews.results.length > 0) && (
                  <h3 className="other-reviews-title">
                    {userReview ? "Other Reviews" : "Reviews"}
                  </h3>
                )}
                <div className="reviews-list">
                  {movie.reviews.results
                    .slice(0, displayedReviews)
                    .map((review) => (
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
                          {review.content.length > 300 && displayedReviews <= 3
                            ? `${review.content.substring(0, 300)}...`
                            : review.content}
                        </div>
                        <div className="review-date">
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Show More button */}
                {movie.reviews.results.length > 3 && displayedReviews <= 3 && (
                  <div className="show-more-container">
                    <button
                      onClick={handleShowMoreReviews}
                      className="btn-text"
                    >
                      Show More Reviews (
                      {movie.reviews.results.length - displayedReviews} more)
                    </button>
                  </div>
                )}
              </>
            ) : userReview ? null : (
              <p className="no-reviews">
                No reviews yet. Be the first to review!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
